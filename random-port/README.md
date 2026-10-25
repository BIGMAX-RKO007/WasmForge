# @wasmforge/random-port

Pure standalone WebAssembly module for generating collision-safe network ports and auditing port service conflicts.

## Features
- **Range Presets**:
  - Ephemeral / Dynamic (49152 - 65535, RFC 6335 compliant)
  - User / Registered (1024 - 49151)
  - Non-privileged (1024 - 65535)
  - Custom bounded range
- **Collision Avoidance**: Automatic filtering of well-known dev and system ports (3000, 3306, 5432, 6379, 8080, 27017, etc.).
- **Service Lookup & Security Audit**: Identify standard protocol, service name, privilege requirement, and vulnerability flags.
- **Universal C-ABI**: Zero JS glue, `alloc`, `dealloc`, `dispatch`.
