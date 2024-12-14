"use client";

import React from "react";
import AnimateWizardWeapon from "./AnimateWizardWeapon";
import { Key, Eye, PawPrint } from "@phosphor-icons/react";

export function AccessDenied() {
  return (
    <div className="p-4 max-w-full text-white rounded-xl backdrop-blur-xs bg-black/65">
      <div className="px-4 py-8 mx-auto max-w-2xl text-center">
        <p className="text-2xl leading-relaxed text-white">
          The path forward is treacherous for those unprepared. To survive, one must arm themselves with the tools
          forged on the Shape blockchain. Only then can one hope to stand strong against the relentless horde and emerge
          victorious.
        </p>
        <p className="text-2xl leading-relaxed text-white">
          Equip eligible NFTs to your connected wallet to start fighting against the horde.
        </p>
        <p className="flex flex-col gap-2 justify-center items-center text-2xl leading-relaxed text-white">
          <span className="flex gap-1 items-center">
            <Key className="w-6 h-6" />
            <a
              className="text-white underline"
              href="https://highlight.xyz/mint/shape:0x05aA491820662b131d285757E5DA4b74BD0F0e5F:31b18ae4b8b0b0be466ec33560d51935"
              target="_blank"
              rel="noreferrer"
            >
              ShapeCraft Key
            </a>
          </span>
          <span className="flex gap-1 items-center">
            <Eye className="w-6 h-6" />
            <a
              className="text-white underline"
              href="https://highlight.xyz/mint/shape:0xF3851e1b7824BD920350E6Fe9B890bb76d01C9f7"
              target="_blank"
              rel="noreferrer"
            >
              Awakened
            </a>
          </span>
          <span className="flex gap-1 items-center">
            <PawPrint className="w-6 h-6" />
            <a
            //   className="text-white underline"
            //   href="https://highlight.xyz/mint/shape:0xF3851e1b7824BD920350E6Fe9B890bb76d01C9f7"
            //   target="_blank"
            //   rel="noreferrer"
            >
              ░░░░ ░░░░░░
            </a>
          </span>
        </p>
      </div>
      <AnimateWizardWeapon />
    </div>
  );
}
