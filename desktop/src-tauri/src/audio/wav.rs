/// Kept for compact in-memory dual-mono WAVs (tests and older callers).
#[allow(dead_code)]
pub fn encode_dual_mono_16k(mic: &[i16], system: &[i16]) -> Vec<u8> {
    let frames = mic.len().max(system.len());
    let data_bytes = frames * 4;
    let mut out = Vec::with_capacity(44 + data_bytes);
    out.extend_from_slice(b"RIFF");
    out.extend_from_slice(&(36 + data_bytes as u32).to_le_bytes());
    out.extend_from_slice(b"WAVE");
    out.extend_from_slice(b"fmt ");
    out.extend_from_slice(&16u32.to_le_bytes());
    out.extend_from_slice(&1u16.to_le_bytes());
    out.extend_from_slice(&2u16.to_le_bytes());
    out.extend_from_slice(&16_000u32.to_le_bytes());
    out.extend_from_slice(&64_000u32.to_le_bytes());
    out.extend_from_slice(&4u16.to_le_bytes());
    out.extend_from_slice(&16u16.to_le_bytes());
    out.extend_from_slice(b"data");
    out.extend_from_slice(&(data_bytes as u32).to_le_bytes());
    for i in 0..frames {
        let left = *mic.get(i).unwrap_or(&0);
        let right = *system.get(i).unwrap_or(&0);
        out.extend_from_slice(&left.to_le_bytes());
        out.extend_from_slice(&right.to_le_bytes());
    }
    out
}

pub fn encode_mono_16k(samples: &[i16]) -> Vec<u8> {
    let data_bytes = samples.len() * 2;
    let mut out = Vec::with_capacity(44 + data_bytes);
    out.extend_from_slice(b"RIFF");
    out.extend_from_slice(&(36 + data_bytes as u32).to_le_bytes());
    out.extend_from_slice(b"WAVE");
    out.extend_from_slice(b"fmt ");
    out.extend_from_slice(&16u32.to_le_bytes());
    out.extend_from_slice(&1u16.to_le_bytes());
    out.extend_from_slice(&1u16.to_le_bytes());
    out.extend_from_slice(&16_000u32.to_le_bytes());
    out.extend_from_slice(&32_000u32.to_le_bytes());
    out.extend_from_slice(&2u16.to_le_bytes());
    out.extend_from_slice(&16u16.to_le_bytes());
    out.extend_from_slice(b"data");
    out.extend_from_slice(&(data_bytes as u32).to_le_bytes());
    for s in samples {
        out.extend_from_slice(&s.to_le_bytes());
    }
    out
}

#[allow(dead_code)]
pub fn split_dual_mono(wav: &[u8]) -> Result<(Vec<u8>, Vec<u8>), String> {
    if wav.len() < 44 {
        return Err("wav too short".into());
    }
    let channels = u16::from_le_bytes([wav[22], wav[23]]);
    let bits = u16::from_le_bytes([wav[34], wav[35]]);
    if channels != 2 || bits != 16 {
        return Err("expected 16-bit stereo wav".into());
    }
    let data = &wav[44..];
    let mut left = Vec::new();
    let mut right = Vec::new();
    let mut i = 0;
    while i + 3 < data.len() {
        left.push(i16::from_le_bytes([data[i], data[i + 1]]));
        right.push(i16::from_le_bytes([data[i + 2], data[i + 3]]));
        i += 4;
    }
    Ok((encode_mono_16k(&left), encode_mono_16k(&right)))
}
