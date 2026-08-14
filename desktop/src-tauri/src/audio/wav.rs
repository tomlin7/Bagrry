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
