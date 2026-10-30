use serde::Serialize;

#[allow(dead_code)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum SpeakerTag {
    Host,
    Attendees,
    Both,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize)]
pub struct SpeechSegment {
    pub speaker: SpeakerTag,
    pub start_ms: u64,
    pub end_ms: u64,
}

/// Voice Activity Detector (VAD) tailored for 16 kHz dual-channel audio streams.
#[allow(dead_code)]
pub struct VadDetector {
    sample_rate: u32,
    frame_size: usize,
    energy_threshold: f32,
    hangover_frames: usize,
    mic_active_counter: usize,
    sys_active_counter: usize,
    current_turn_start: Option<(u64, SpeakerTag)>,
    processed_samples: u64,
}

#[allow(dead_code)]
impl VadDetector {
    pub fn new(sample_rate: u32) -> Self {
        let frame_size = (sample_rate as f32 * 0.030) as usize; // 30ms window (480 samples @ 16kHz)
        Self {
            sample_rate,
            frame_size,
            energy_threshold: 0.012, // Tuned for normalized audio
            hangover_frames: 10,     // ~300ms hangover
            mic_active_counter: 0,
            sys_active_counter: 0,
            current_turn_start: None,
            processed_samples: 0,
        }
    }

    /// Process synchronized mic and system loopback samples.
    /// Returns any completed conversational speech segments.
    pub fn process_frames(
        &mut self,
        mic_samples: &[i16],
        sys_samples: &[i16],
    ) -> Vec<SpeechSegment> {
        let mut segments = Vec::new();
        let len = mic_samples.len().min(sys_samples.len());
        if len == 0 {
            return segments;
        }

        for chunk_idx in (0..len).step_by(self.frame_size) {
            let chunk_end = (chunk_idx + self.frame_size).min(len);
            let frame_len = chunk_end - chunk_idx;
            if frame_len < self.frame_size / 2 {
                break;
            }

            let mic_chunk = &mic_samples[chunk_idx..chunk_end];
            let sys_chunk = &sys_samples[chunk_idx..chunk_end];

            let mic_energy = calculate_rms(mic_chunk);
            let sys_energy = calculate_rms(sys_chunk);

            let mic_speech = mic_energy > self.energy_threshold;
            let sys_speech = sys_energy > self.energy_threshold;

            if mic_speech {
                self.mic_active_counter = self.hangover_frames;
            } else if self.mic_active_counter > 0 {
                self.mic_active_counter -= 1;
            }

            if sys_speech {
                self.sys_active_counter = self.hangover_frames;
            } else if self.sys_active_counter > 0 {
                self.sys_active_counter -= 1;
            }

            let current_active = if self.mic_active_counter > 0 && self.sys_active_counter > 0 {
                Some(SpeakerTag::Both)
            } else if self.mic_active_counter > 0 {
                Some(SpeakerTag::Host)
            } else if self.sys_active_counter > 0 {
                Some(SpeakerTag::Attendees)
            } else {
                None
            };

            let current_time_ms =
                ((self.processed_samples + chunk_idx as u64) * 1000) / self.sample_rate as u64;

            match (self.current_turn_start, current_active) {
                (None, Some(speaker)) => {
                    self.current_turn_start = Some((current_time_ms, speaker));
                }
                (Some((start_ms, prev_speaker)), Some(new_speaker)) => {
                    if prev_speaker != new_speaker && (current_time_ms - start_ms) > 1000 {
                        // Speaker transition after sustained speech
                        segments.push(SpeechSegment {
                            speaker: prev_speaker,
                            start_ms,
                            end_ms: current_time_ms,
                        });
                        self.current_turn_start = Some((current_time_ms, new_speaker));
                    }
                }
                (Some((start_ms, speaker)), None) => {
                    // Speech segment ended
                    if current_time_ms > start_ms + 200 {
                        segments.push(SpeechSegment {
                            speaker,
                            start_ms,
                            end_ms: current_time_ms,
                        });
                    }
                    self.current_turn_start = None;
                }
                (None, None) => {}
            }
        }

        self.processed_samples += len as u64;
        segments
    }

    /// Flush any open speech turn when recording finishes.
    pub fn flush(&mut self) -> Option<SpeechSegment> {
        if let Some((start_ms, speaker)) = self.current_turn_start.take() {
            let current_time_ms = (self.processed_samples * 1000) / self.sample_rate as u64;
            if current_time_ms > start_ms + 200 {
                return Some(SpeechSegment {
                    speaker,
                    start_ms,
                    end_ms: current_time_ms,
                });
            }
        }
        None
    }
}

#[allow(dead_code)]
fn calculate_rms(samples: &[i16]) -> f32 {
    if samples.is_empty() {
        return 0.0;
    }
    let mut sum = 0.0f64;
    for &s in samples {
        let f = s as f64 / 32768.0;
        sum += f * f;
    }
    (sum / samples.len() as f64).sqrt() as f32
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vad_silence_detection() {
        let mut vad = VadDetector::new(16000);
        let silence = vec![0i16; 16000]; // 1s silence
        let segments = vad.process_frames(&silence, &silence);
        assert!(segments.is_empty());
        assert!(vad.flush().is_none());
    }

    #[test]
    fn test_vad_host_speech_segment() {
        let mut vad = VadDetector::new(16000);
        // 500ms speech on mic
        let mut speech = Vec::new();
        for i in 0..8000 {
            let sample = ((i as f32 * 0.1).sin() * 16000.0) as i16;
            speech.push(sample);
        }
        let silence = vec![0i16; 8000];

        let _ = vad.process_frames(&speech, &silence);
        // Followed by silence to trigger boundary
        let segments = vad.process_frames(&silence, &silence);
        let all: Vec<_> = segments.into_iter().chain(vad.flush()).collect();

        assert!(!all.is_empty());
        assert_eq!(all[0].speaker, SpeakerTag::Host);
    }
}
