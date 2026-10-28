use std::fs::{File, OpenOptions};
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{mpsc, Mutex};
use std::thread::JoinHandle;

/// Disk-backed 16-bit PCM (little-endian, 16 kHz mono). Capture callbacks send
/// short buffers over a channel so the audio thread never blocks on `write`.
pub struct PcmSink {
    pub path: PathBuf,
    tx: Mutex<Option<mpsc::Sender<Vec<i16>>>>,
    writer: Mutex<Option<JoinHandle<()>>>,
    samples: AtomicU64,
    max_samples: u64,
}

impl PcmSink {
    pub fn create(path: PathBuf, max_samples: u64) -> Result<Self, String> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| format!("recording dir: {e}"))?;
        }
        let file = OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(&path)
            .map_err(|e| format!("open pcm {}: {e}", path.display()))?;
        let (tx, rx) = mpsc::channel::<Vec<i16>>();
        let writer = std::thread::Builder::new()
            .name("pcm-writer".into())
            .spawn(move || writer_loop(file, rx))
            .map_err(|e| e.to_string())?;
        Ok(Self {
            path,
            tx: Mutex::new(Some(tx)),
            writer: Mutex::new(Some(writer)),
            samples: AtomicU64::new(0),
            max_samples,
        })
    }

    pub fn push(&self, samples: &[i16]) {
        if samples.is_empty() {
            return;
        }
        let written = self.samples.load(Ordering::Relaxed);
        if written >= self.max_samples {
            return;
        }
        let room = (self.max_samples - written) as usize;
        let slice = if samples.len() > room {
            &samples[..room]
        } else {
            samples
        };
        if let Ok(guard) = self.tx.lock() {
            if let Some(tx) = guard.as_ref() {
                if tx.send(slice.to_vec()).is_ok() {
                    self.samples
                        .fetch_add(slice.len() as u64, Ordering::Relaxed);
                }
            }
        }
    }

    pub fn sample_count(&self) -> u64 {
        self.samples.load(Ordering::Relaxed)
    }

    pub fn byte_len(&self) -> u64 {
        self.sample_count() * 2
    }

    pub fn read_range(&self, start: u64, len: u64) -> Result<Vec<i16>, String> {
        read_i16_range(&self.path, start, len)
    }

    /// Drop the sender and wait for the writer to flush. Safe to call twice.
    pub fn finish(&self) {
        if let Ok(mut guard) = self.tx.lock() {
            guard.take();
        }
        if let Ok(mut guard) = self.writer.lock() {
            if let Some(handle) = guard.take() {
                let _ = handle.join();
            }
        }
    }
}

impl Drop for PcmSink {
    fn drop(&mut self) {
        self.finish();
    }
}

fn writer_loop(mut file: File, rx: mpsc::Receiver<Vec<i16>>) {
    while let Ok(chunk) = rx.recv() {
        if chunk.is_empty() {
            continue;
        }
        let bytes: Vec<u8> = chunk.iter().flat_map(|s| s.to_le_bytes()).collect();
        if file.write_all(&bytes).is_err() {
            break;
        }
        let _ = file.flush();
    }
    let _ = file.sync_all();
}

pub fn read_i16_range(path: &Path, start: u64, len: u64) -> Result<Vec<i16>, String> {
    if len == 0 {
        return Ok(Vec::new());
    }
    let mut file = File::open(path).map_err(|e| format!("read pcm {}: {e}", path.display()))?;
    let meta = file
        .metadata()
        .map_err(|e| format!("pcm metadata: {e}"))?;
    let available = meta.len() / 2;
    if start >= available {
        return Ok(Vec::new());
    }
    let take = len.min(available - start);
    file.seek(SeekFrom::Start(start * 2))
        .map_err(|e| format!("seek pcm: {e}"))?;
    let mut buf = vec![0u8; (take * 2) as usize];
    file.read_exact(&mut buf)
        .map_err(|e| format!("read pcm bytes: {e}"))?;
    Ok(buf
        .chunks_exact(2)
        .map(|c| i16::from_le_bytes([c[0], c[1]]))
        .collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip_pcm_range() {
        let dir = std::env::temp_dir().join(format!("bagrry-pcm-{}", std::process::id()));
        let path = dir.join("t.pcm");
        let sink = PcmSink::create(path.clone(), 16_000).unwrap();
        sink.push(&[1, 2, 3, 4, 5, 6, 7, 8]);
        sink.finish();
        assert_eq!(sink.sample_count(), 8);
        let mid = read_i16_range(&path, 2, 3).unwrap();
        assert_eq!(mid, vec![3, 4, 5]);
        let _ = std::fs::remove_dir_all(dir);
    }
}

