use std::sync::atomic::{AtomicUsize, Ordering};

/// A high-performance lock-free single-producer single-consumer (SPSC) ring buffer
/// for low-latency audio capture pipelines.
#[allow(dead_code)]
pub struct AudioRingBuffer<T: Copy + Default> {
    buffer: Box<[T]>,
    capacity: usize,
    head: AtomicUsize, // Written by consumer
    tail: AtomicUsize, // Written by producer
}

unsafe impl<T: Copy + Default + Send> Send for AudioRingBuffer<T> {}
unsafe impl<T: Copy + Default + Sync> Sync for AudioRingBuffer<T> {}

#[allow(dead_code)]
impl<T: Copy + Default> AudioRingBuffer<T> {
    pub fn new(capacity: usize) -> Self {
        // Ensure non-zero capacity
        let cap = capacity.max(1024);
        let mut vec = Vec::with_capacity(cap);
        vec.resize(cap, T::default());
        Self {
            buffer: vec.into_boxed_slice(),
            capacity: cap,
            head: AtomicUsize::new(0),
            tail: AtomicUsize::new(0),
        }
    }

    /// Number of elements available to read.
    pub fn available_read(&self) -> usize {
        let tail = self.tail.load(Ordering::Acquire);
        let head = self.head.load(Ordering::Acquire);
        if tail >= head {
            tail - head
        } else {
            self.capacity - (head - tail)
        }
    }

    /// Number of elements available to write without overwriting unread elements.
    pub fn available_write(&self) -> usize {
        self.capacity.saturating_sub(self.available_read() + 1)
    }

    /// Push elements into the ring buffer. Returns the number of elements written.
    pub fn push(&self, data: &[T]) -> usize {
        let avail = self.available_write();
        let to_write = data.len().min(avail);
        if to_write == 0 {
            return 0;
        }

        let tail = self.tail.load(Ordering::Relaxed);
        let first_chunk = to_write.min(self.capacity - tail);
        let second_chunk = to_write - first_chunk;

        unsafe {
            let buf_ptr = self.buffer.as_ptr() as *mut T;
            std::ptr::copy_nonoverlapping(data.as_ptr(), buf_ptr.add(tail), first_chunk);
            if second_chunk > 0 {
                std::ptr::copy_nonoverlapping(data.as_ptr().add(first_chunk), buf_ptr, second_chunk);
            }
        }

        let new_tail = (tail + to_write) % self.capacity;
        self.tail.store(new_tail, Ordering::Release);
        to_write
    }

    /// Read elements out of the ring buffer into `dest`. Returns the number of elements read.
    pub fn pop(&self, dest: &mut [T]) -> usize {
        let avail = self.available_read();
        let to_read = dest.len().min(avail);
        if to_read == 0 {
            return 0;
        }

        let head = self.head.load(Ordering::Relaxed);
        let first_chunk = to_read.min(self.capacity - head);
        let second_chunk = to_read - first_chunk;

        unsafe {
            let buf_ptr = self.buffer.as_ptr();
            std::ptr::copy_nonoverlapping(buf_ptr.add(head), dest.as_mut_ptr(), first_chunk);
            if second_chunk > 0 {
                std::ptr::copy_nonoverlapping(buf_ptr, dest.as_mut_ptr().add(first_chunk), second_chunk);
            }
        }

        let new_head = (head + to_read) % self.capacity;
        self.head.store(new_head, Ordering::Release);
        to_read
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ring_buffer_push_pop() {
        let rb = AudioRingBuffer::<i16>::new(16);
        let input = [1, 2, 3, 4, 5];
        let written = rb.push(&input);
        assert_eq!(written, 5);
        assert_eq!(rb.available_read(), 5);

        let mut out = [0i16; 5];
        let read = rb.pop(&mut out);
        assert_eq!(read, 5);
        assert_eq!(out, input);
        assert_eq!(rb.available_read(), 0);
    }

    #[test]
    fn test_ring_buffer_wraparound() {
        let rb = AudioRingBuffer::<i16>::new(8);
        // Fill 6
        rb.push(&[10, 20, 30, 40, 50, 60]);
        // Drain 4
        let mut buf = [0i16; 4];
        rb.pop(&mut buf);
        assert_eq!(buf, [10, 20, 30, 40]);

        // Push 4 more (wraps around)
        rb.push(&[70, 80, 90, 100]);
        let mut out = [0i16; 6];
        let read = rb.pop(&mut out);
        assert_eq!(read, 6);
        assert_eq!(out, [50, 60, 70, 80, 90, 100]);
    }
}
