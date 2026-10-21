import { useEffect, useState } from "react";

export function Avatar({ blob }) {
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (!blob) {
      setImageUrl("");
      return;
    }

    const url = URL.createObjectURL(blob);
    setImageUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [blob]);

  if (!imageUrl) return null;

  return (
    <img
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        objectPosition: "center",
        display: "block",
      }}
      src={imageUrl}
      alt="Avatar"
    />
  );
}
