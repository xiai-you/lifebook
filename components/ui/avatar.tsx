import { cn } from "@/lib/utils";

/** 头像 —— 圆形，优先真实头像，回退首字母占位，加载失败回退首字母。 */
const sizeClasses = {
  xs: "h-5 w-5 text-[10px]",
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
  xl: "h-12 w-12 text-lg",
} as const;

const sizePx = { xs: 20, sm: 24, md: 32, lg: 40, xl: 48 } as const;

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={sizePx[size]}
        height={sizePx[size]}
        loading="lazy"
        className={cn("rounded-full object-cover", sizeClasses[size], className)}
        onError={(e) => {
          // 头像加载失败：回退为首字母占位（移除图片元素）
          const el = e.currentTarget;
          el.replaceWith(
            Object.assign(document.createElement("span"), {
              className: `${sizeClasses[size]} ${className ?? ""} flex shrink-0 items-center justify-center rounded-full bg-primary font-medium text-inverse`,
              textContent: name.charAt(0),
            })
          );
        }}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary font-medium text-inverse",
        sizeClasses[size],
        className
      )}
    >
      {name.charAt(0)}
    </span>
  );
}
