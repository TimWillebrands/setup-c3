# setup-zig

Install the C3 compiler for use in an Actions workflow.

## Usage

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    name: Build and Test
    steps:
      - uses: actions/checkout@v3
      - uses: TimWillebrands/setup-c3@v1
      - run: zig build test
```

This will automatically download C3 and install it to `PATH`.

You can use `version` to set a C3 version to download. This must be a github release tag (`v0.6.5`).
The default is `latest`.

```yaml
  - uses: TimWillebrands/setup-c3@v1
    with:
      version: v0.6.5
```
