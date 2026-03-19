import qrcode from "qrcode-terminal";

export const displayQrCode = (url: string): void => {
  qrcode.generate(url, { small: true }, (code: string) => {
    console.log(code);
  });
};
