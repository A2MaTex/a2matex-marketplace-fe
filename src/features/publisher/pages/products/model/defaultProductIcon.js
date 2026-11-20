import { staticApi } from "@api/static/staticApi";

const CANVAS_SIZE = 512;

const roundedRect = (context, x, y, width, height, radius) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height,
  );
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
};

const canvasToPng = (canvas) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Unable to generate the default product icon."));
    }, "image/png");
  });

export const createDefaultProductIconFile = async () => {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Default product icon rendering is unavailable.");

  const background = context.createLinearGradient(40, 32, 472, 480);
  background.addColorStop(0, "#163247");
  background.addColorStop(0.55, "#0c1d2b");
  background.addColorStop(1, "#081019");
  roundedRect(context, 0, 0, CANVAS_SIZE, CANVAS_SIZE, 88);
  context.fillStyle = background;
  context.fill();

  const glow = context.createRadialGradient(256, 210, 12, 256, 240, 230);
  glow.addColorStop(0, "rgba(55, 216, 239, 0.34)");
  glow.addColorStop(1, "rgba(55, 216, 239, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  context.strokeStyle = "#42d2e9";
  context.lineWidth = 24;
  context.lineJoin = "round";
  roundedRect(context, 142, 182, 228, 210, 24);
  context.stroke();

  context.beginPath();
  context.moveTo(186, 184);
  context.lineTo(216, 132);
  context.lineTo(296, 132);
  context.lineTo(326, 184);
  context.stroke();

  context.beginPath();
  context.arc(256, 250, 48, 0, Math.PI, false);
  context.stroke();

  const blob = await canvasToPng(canvas);
  return new File([blob], "default-product-icon.png", {
    type: "image/png",
    lastModified: Date.now(),
  });
};

export const uploadDefaultProductIcon = async () => {
  const file = await createDefaultProductIconFile();
  const response = await staticApi.uploadImage({ file });
  const staticId = response.data?.data?.id;
  if (typeof staticId !== "string" || staticId.length === 0) {
    throw new Error("The image service did not return a default icon asset id.");
  }
  return {
    staticId,
    type: "ICON",
    sortOrder: 0,
    altText: "Default product icon",
  };
};
