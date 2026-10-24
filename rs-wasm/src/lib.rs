// Pure C-ABI WebAssembly Exports (No wasm-bindgen JS glue required)

#[no_mangle]
pub extern "C" fn add(a: i32, b: i32) -> i32 {
    a + b
}

/// 供宿主分配 WASM 线性内存 (基于 Box<[u8]>)
#[no_mangle]
pub extern "C" fn alloc(size: usize) -> *mut u8 {
    let buf = vec![0u8; size].into_boxed_slice();
    Box::into_raw(buf) as *mut u8
}

/// 供宿主释放 WASM 线性内存 (与 alloc 和 greet 的 Box<[u8]> 对齐)
#[no_mangle]
pub extern "C" fn dealloc(ptr: *mut u8, size: usize) {
    if !ptr.is_null() && size > 0 {
        unsafe {
            let slice = std::slice::from_raw_parts_mut(ptr, size);
            drop(Box::from_raw(slice));
        }
    }
}

/// 统一标准：传入 UTF-8 字符串指针与长度，返回打包的 (ptr << 32) | len
#[no_mangle]
pub extern "C" fn greet(ptr: *const u8, len: usize) -> u64 {
    let slice = unsafe { std::slice::from_raw_parts(ptr, len) };
    let name = std::str::from_utf8(slice).unwrap_or("World");
    let msg = format!("Hello, {}! This is WebAssembly powered by Rust 🦀", name);
    let boxed = msg.into_bytes().into_boxed_slice();
    let out_len = boxed.len() as u64;
    let out_ptr = Box::into_raw(boxed) as *mut u8 as u64;
    (out_ptr << 32) | (out_len & 0xFFFFFFFF)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(1, 2), 3);
    }
}
