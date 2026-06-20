import React from "react";
import { cn } from "@/lib/utils";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fill?: boolean;
}

/**
 * Simple image component that replaces Next.js Image.
 * When `fill` is true, the image will fill its parent container (parent must have position: relative).
 */
const CompatImage = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ fill, className, ...props }, ref) => {
    if (fill) {
      return (
        <img
          {...props}
          ref={ref}
          className={cn(
            "absolute inset-0 w-full h-full",
            className
          )}
        />
      );
    }
    return <img {...props} ref={ref} className={className} />;
  }
);

CompatImage.displayName = "CompatImage";

export default CompatImage;
