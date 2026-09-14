"use client";

import { motion } from "framer-motion";
import { WorkCard } from "./WorkCard";
import type { Work } from "@/types";

/**
 * 作品瀑布流（复用首页错落排版），供发现 / 书架 / 个人页使用。
 * Art Direction 2.0：卡片入场轻微上浮淡入（每张 40ms 错峰），快速 / 轻盈 / 柔和。
 */
export function WorkMasonry({ works }: { works: Work[] }) {
  return (
    <div className="columns-2 gap-4 md:columns-3">
      {works.map((work, i) => (
        <motion.div
          key={work.id}
          className="break-inside-avoid"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: (i % 6) * 0.04,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <WorkCard work={work} />
        </motion.div>
      ))}
    </div>
  );
}
