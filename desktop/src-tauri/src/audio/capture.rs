use super::resample::{resample_mono, rms, to_mono_i16};
use super::sink::PcmSink;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::SampleFormat;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::JoinHandle;

pub fn start_mic(
    stop: Arc<AtomicBool>,
    paused: Arc<AtomicBool>,
    pcm: Arc<PcmSink>,
    level: Arc<AtomicU32>,
    last_error: Arc<Mutex<Option<String>>>,
    target_hz: u32,
) -> Result<JoinHandle<()>, String> {
    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .ok_or_else(|| "no microphone found".to_string())?;
    let config = device
        .default_input_config()
        .map_err(|e| format!("mic config: {e}"))?;
    let sample_rate = config.sample_rate().0;
    let channels = config.channels() as usize;
    let format = config.sample_format();
    let stream_config = config.into();
    std::thread::Builder::new()
        .name("mic-capture".into())
        .spawn(move || {
            let last_error_cb = last_error.clone();
            let err_fn = move |e| {
                let msg = format!("mic stream error: {e}");
                eprintln!("{msg}");
                if let Ok(mut slot) = last_error_cb.lock() {
                    *slot = Some(msg);
                }
            };
            let stream = match format {
                SampleFormat::F32 => device.build_input_stream(
                    &stream_config,
                    {
                        let stop = stop.clone();
                        let paused = paused.clone();
                        let pcm = pcm.clone();
                        let level = level.clone();
                        move |data: &[f32], _| {
                            if stop.load(Ordering::Relaxed) {
                                return;
                            }
                            ingest_f32(data, channels, sample_rate, target_hz, paused.as_ref(), &pcm, &level);
                        }
                    },
                    err_fn,
                    None,
                ),
                SampleFormat::I16 => device.build_input_stream(
                    &stream_config,
                    {
                        let stop = stop.clone();
                        let paused = paused.clone();
                        let pcm = pcm.clone();
                        let level = level.clone();
                        move |data: &[i16], _| {
                            if stop.load(Ordering::Relaxed) {
                                return;
                            }
                            ingest_i16(data, channels, sample_rate, target_hz, paused.as_ref(), &pcm, &level);
                        }
                    },
                    err_fn,
                    None,
                ),
                SampleFormat::I32 => device.build_input_stream(
                    &stream_config,
                    {
                        let stop = stop.clone();
                        let paused = paused.clone();
                        let pcm = pcm.clone();
                        let level = level.clone();
                        move |data: &[i32], _| {
                            if stop.load(Ordering::Relaxed) {
                                return;
                            }
                            let f: Vec<f32> = data.iter().map(|s| *s as f32 / i32::MAX as f32).collect();
                            ingest_f32(&f, channels, sample_rate, target_hz, paused.as_ref(), &pcm, &level);
                        }
                    },
                    err_fn,
                    None,
                ),
                other => {
                    let msg = format!("unsupported mic format: {other}");
                    eprintln!("{msg}");
                    if let Ok(mut slot) = last_error.lock() {
                        *slot = Some(msg);
                    }
                    return;
                }
            };
            let stream = match stream {
                Ok(s) => s,
                Err(e) => {
                    let msg = format!("mic stream: {e}");
                    eprintln!("{msg}");
                    if let Ok(mut slot) = last_error.lock() {
                        *slot = Some(msg);
                    }
                    return;
                }
            };
            if let Err(e) = stream.play() {
                let msg = format!("mic play: {e}");
                eprintln!("{msg}");
                if let Ok(mut slot) = last_error.lock() {
                    *slot = Some(msg);
                }
                return;
            }
            while !stop.load(Ordering::Relaxed) {
                std::thread::sleep(std::time::Duration::from_millis(20));
            }
            drop(stream);
        })
        .map_err(|e| e.to_string())
}

pub fn start_loopback(
    stop: Arc<AtomicBool>,
    paused: Arc<AtomicBool>,
    pcm: Arc<PcmSink>,
    level: Arc<AtomicU32>,
    last_error: Arc<Mutex<Option<String>>>,
    target_hz: u32,
) -> (Option<JoinHandle<()>>, bool) {
    #[cfg(windows)]
    {
        match spawn_wasapi_loopback(stop, paused, pcm, level, last_error.clone(), target_hz) {
            Ok(handle) => (Some(handle), true),
            Err(e) => {
                eprintln!("loopback unavailable: {e}");
                if let Ok(mut slot) = last_error.lock() {
                    *slot = Some(format!("System audio unavailable: {e}"));
                }
                (None, false)
            }
        }
    }
    #[cfg(not(windows))]
    {
        let _ = (stop, paused, pcm, level, last_error, target_hz);
        (None, false)
    }
}

fn ingest_f32(
    data: &[f32],
    channels: usize,
    sample_rate: u32,
    target_hz: u32,
    paused: &AtomicBool,
    pcm: &PcmSink,
    level: &AtomicU32,
) {
    let mut mono = Vec::with_capacity(data.len() / channels.max(1));
    for frame in data.chunks(channels.max(1)) {
        mono.push(to_mono_i16(frame, channels.max(1)));
    }
    let resampled = resample_mono(&mono, sample_rate, target_hz);
    level.store(rms(&resampled).to_bits(), Ordering::Relaxed);
    if paused.load(Ordering::Relaxed) {
        return;
    }
    pcm.push(&resampled);
}

fn ingest_i16(
    data: &[i16],
    channels: usize,
    sample_rate: u32,
    target_hz: u32,
    paused: &AtomicBool,
    pcm: &PcmSink,
    level: &AtomicU32,
) {
    let mut as_f = Vec::with_capacity(data.len());
    for s in data {
        as_f.push(*s as f32 / i16::MAX as f32);
    }
    ingest_f32(&as_f, channels, sample_rate, target_hz, paused, pcm, level);
}

#[cfg(windows)]
fn spawn_wasapi_loopback(
    stop: Arc<AtomicBool>,
    paused: Arc<AtomicBool>,
    pcm: Arc<PcmSink>,
    level: Arc<AtomicU32>,
    last_error: Arc<Mutex<Option<String>>>,
    target_hz: u32,
) -> Result<JoinHandle<()>, String> {
    let handle = std::thread::Builder::new()
        .name("wasapi-loopback".into())
        .spawn(move || {
            if let Err(e) = wasapi_loopback_thread(stop, paused, pcm, level, target_hz) {
                let msg = format!("loopback thread: {e}");
                eprintln!("{msg}");
                if let Ok(mut slot) = last_error.lock() {
                    *slot = Some(msg);
                }
            }
        })
        .map_err(|e| e.to_string())?;
    Ok(handle)
}

#[cfg(windows)]
fn wasapi_loopback_thread(
    stop: Arc<AtomicBool>,
    paused: Arc<AtomicBool>,
    pcm: Arc<PcmSink>,
    level: Arc<AtomicU32>,
    target_hz: u32,
) -> Result<(), String> {
    use windows::Win32::Media::Audio::{
        eConsole, eRender, IAudioCaptureClient, IAudioClient, IMMDeviceEnumerator,
        MMDeviceEnumerator, AUDCLNT_SHAREMODE_SHARED, AUDCLNT_STREAMFLAGS_LOOPBACK, WAVEFORMATEX,
    };
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CoTaskMemFree, CLSCTX_ALL, COINIT_MULTITHREADED,
    };

    unsafe {
        let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
        let enumerator: IMMDeviceEnumerator =
            CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL)
                .map_err(|e| format!("enumerator: {e}"))?;
        let device = enumerator
            .GetDefaultAudioEndpoint(eRender, eConsole)
            .map_err(|e| format!("render endpoint: {e}"))?;
        let audio_client: IAudioClient = device
            .Activate(CLSCTX_ALL, None)
            .map_err(|e| format!("activate: {e}"))?;
        let mix = audio_client.GetMixFormat().map_err(|e| format!("mix format: {e}"))?;
        let format: WAVEFORMATEX = *mix;
        audio_client
            .Initialize(
                AUDCLNT_SHAREMODE_SHARED,
                AUDCLNT_STREAMFLAGS_LOOPBACK,
                10_000_000,
                0,
                mix,
                None,
            )
            .map_err(|e| format!("initialize loopback: {e}"))?;
        let capture: IAudioCaptureClient = audio_client
            .GetService()
            .map_err(|e| format!("capture client: {e}"))?;
        audio_client.Start().map_err(|e| format!("start: {e}"))?;

        let channels = format.nChannels.max(1) as usize;
        let sample_rate = format.nSamplesPerSec;
        let bits = format.wBitsPerSample;
        let is_float = format.wFormatTag == 3
            || (format.wFormatTag == 0xFFFE && bits == 32);

        while !stop.load(Ordering::Relaxed) {
            let packet = capture
                .GetNextPacketSize()
                .map_err(|e| format!("packet size: {e}"))?;
            if packet == 0 {
                std::thread::sleep(std::time::Duration::from_millis(8));
                continue;
            }
            let mut data_ptr: *mut u8 = std::ptr::null_mut();
            let mut num_frames = 0u32;
            let mut flags = 0u32;
            capture
                .GetBuffer(&mut data_ptr, &mut num_frames, &mut flags, None, None)
                .map_err(|e| format!("get buffer: {e}"))?;
            if !data_ptr.is_null() && num_frames > 0 {
                let frames = num_frames as usize;
                let mut f32s = Vec::with_capacity(frames * channels);
                if is_float || bits == 32 {
                    let slice = std::slice::from_raw_parts(data_ptr as *const f32, frames * channels);
                    f32s.extend_from_slice(slice);
                } else if bits == 16 {
                    let slice = std::slice::from_raw_parts(data_ptr as *const i16, frames * channels);
                    for s in slice {
                        f32s.push(*s as f32 / i16::MAX as f32);
                    }
                }
                ingest_f32(
                    &f32s,
                    channels,
                    sample_rate,
                    target_hz,
                    paused.as_ref(),
                    pcm.as_ref(),
                    level.as_ref(),
                );
            }
            capture
                .ReleaseBuffer(num_frames)
                .map_err(|e| format!("release: {e}"))?;
        }
        let _ = audio_client.Stop();
        CoTaskMemFree(Some(mix as *const std::ffi::c_void));
    }
    Ok(())
}
