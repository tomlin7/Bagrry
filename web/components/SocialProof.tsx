'use client'

import React from 'react'
import Image from 'next/image'

const LOGOS = [
  { name: 'Anthropic', src: '/assets/img_02.png', width: 140, height: 23 },
  { name: 'Google', src: '/assets/img_03.png', width: 90, height: 28 },
  { name: 'WeWork', src: '/assets/img_04.png', width: 95, height: 26 },
  { name: 'Emergent', src: '/assets/img_05.png', width: 120, height: 26 },
  { name: 'Parallel AI', src: '/assets/img_06.png', width: 130, height: 25 },
  { name: 'CRED', src: '/assets/img_07.png', width: 85, height: 28 },
  { name: 'Blinkit', src: '/assets/img_08.png', width: 80, height: 24 },
  { name: 'Composio', src: '/assets/img_09.png', width: 110, height: 26 },
]

export function SocialProof() {
  return (
    <section className="py-14 bg-white overflow-hidden">
      <div className="max-w-[1024px] mx-auto px-6 mb-8 text-center">
        <span className="text-[18px] font-light text-[#999999] tracking-normal font-roboto">
          TRUSTED BY FOLKS AT
        </span>
      </div>

      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <div className="flex items-center gap-16 animate-marquee w-max py-2">
          {[...LOGOS, ...LOGOS].map((logo, idx) => (
            <div
              key={idx}
              className="flex items-center justify-center grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-200 cursor-pointer"
            >
              <Image
                src={logo.src}
                alt={logo.name}
                width={logo.width}
                height={logo.height}
                className="h-7 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
