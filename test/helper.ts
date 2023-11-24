export const writeData = async (data: any, path = "demo.json") => {
  // const file = Bun.file(path);
  // const contents = await file.json();
  Bun.write(path, JSON.stringify(data, null, 2));
};
