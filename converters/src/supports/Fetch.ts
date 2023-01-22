let _nodeFetch: typeof fetch | undefined;
let _fetch: typeof fetch = fetch;
if (!_fetch) {
  _fetch = async (input, init) => {
    if (!_nodeFetch) {
      _nodeFetch = (await import("node-fetch")).default as typeof fetch;
    }
    return await _nodeFetch(input, init);
  };
}

export default _fetch;
