pub fn to_mono_i16(frame: &[f32], channels: usize) -> i16 {
    if channels == 0 {
        return 0;
    }
    let mut sum = 0.0f32;
    for ch in 0..channels {
        sum += frame.get(ch).copied().unwrap_or(0.0);
    }
    let sample = (sum / channels as f32).clamp(-1.0, 1.0);
    (sample * i16::MAX as f32) as i16
}

pub fn resample_mono(input: &[i16], from_hz: u32, to_hz: u32) -> Vec<i16> {
    if input.is_empty() || from_hz == 0 {
        return Vec::new();
    }
    if from_hz == to_hz {
        return input.to_vec();
    }
    let ratio = from_hz as f64 / to_hz as f64;
    let out_len = ((input.len() as f64) / ratio).max(1.0) as usize;
    let last = input.len() - 1;
    let mut out = Vec::with_capacity(out_len);
    for i in 0..out_len {
        let src = i as f64 * ratio;
        let i0 = (src.floor() as usize).min(last);
        let i1 = (i0 + 1).min(last);
        let frac = src - i0 as f64;
        let v = input[i0] as f64 * (1.0 - frac) + input[i1] as f64 * frac;
        out.push(v.round() as i16);
    }
    out
}

pub fn rms(samples: &[i16]) -> f32 {
    if samples.is_empty() {
        return 0.0;
    }
    let sum: f64 = samples
        .iter()
        .map(|s| {
            let x = *s as f64 / i16::MAX as f64;
            x * x
        })
        .sum();
    ((sum / samples.len() as f64).sqrt() as f32).clamp(0.0, 1.0)
}

/// Kept for tests and future in-memory capture caps.
#[allow(dead_code)]
pub fn push_capped(buf: &mut Vec<i16>, extra: &[i16], max_samples: usize) {
    buf.extend_from_slice(extra);
    if buf.len() > max_samples {
        let drop_n = buf.len() - max_samples;
        buf.drain(0..drop_n);
    }
}
