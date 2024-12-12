"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useLogin, usePrivy, useLogout } from "@privy-io/react-auth";
import { Wallet, SignOut, ShieldWarning } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { generateAvatar } from "@/utils/utils";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { ready, authenticated, user, exportWallet } = usePrivy();
  const disableLogin = !ready || authenticated;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  const { logout } = useLogout({
    onSuccess: async () => {
      console.log("logout..");
      // router.push('/');
    },
  });

  const { login } = useLogin({
    onComplete: async (user, isNewUser, wasAlreadyAuthenticated) => {
      console.log("login..", isNewUser, wasAlreadyAuthenticated, user);

      if (isNewUser) {
        toast({
          title: "Welcome to ShapeCraft Survivors!",
        });
        if (
          user.twitter &&
          user.twitter.profilePictureUrl &&
          user.twitter.username
        ) {
          // await insertNewLogin(user.twitter.username, user.twitter.profilePictureUrl);
          // queryClient.invalidateQueries({ queryKey: ["memberCount"] });
        }
      } else {
        toast({
          title: "Welcome back!",
        });
      }
    },
    onError: (error) => {
      console.log("login error..", error);
      toast({
        title: "Login Error",
        variant: "destructive",
        description: ":(",
      });
    },
  });

  // Generate avatar image based on user's address
  const avatarImage = useMemo(() => {
    if (user?.twitter) {
      return user?.twitter?.profilePictureUrl;
    } else {
      if (user?.wallet) return generateAvatar(user?.wallet?.address || "");
    }
  }, [user?.wallet?.address, user?.twitter?.profilePictureUrl]);

  // Add check for embedded wallet
  const hasEmbeddedWallet = useMemo(() => {
    return user?.linkedAccounts?.some(
      (account) => account.type === "wallet" && account.walletClient === "privy"
    );
  }, [user?.linkedAccounts]);

  return (
    <>
      <nav className="fixed top-0 z-50 w-full">
        <div className="absolute inset-0 bg-gradient-to-b from-black to-transparent pointer-events-none via-black/50"></div>
        <div className="container flex relative justify-between items-center px-4 py-4 mx-auto font-vt323">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative size-14 md:size-18">
                <Image
                  src="/shapecraft-surviors-logo.svg"
                  alt="shapecraft"
                  fill
                  className="object-contain w-full h-full"
                  priority
                />
              </div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                ShapeCraft Survivors
              </h1>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {ready && authenticated ? (
              <DropdownMenu onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Avatar className="size-8 md:size-12 cursor-pointer ring-2 ring-[#F5A190] transition-all hover:ring-[#f39c12]">
                    <AvatarImage src={avatarImage} alt="" />
                    <AvatarFallback>
                      {user?.wallet?.address
                        ? user.wallet.address.slice(0, 4)
                        : "gm"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-[60]">
                  {user?.twitter && (
                    <DropdownMenuLabel>{`@${user?.twitter?.username}`}</DropdownMenuLabel>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Wallet className="mr-2 w-4 h-4" />
                    <span>
                      {user?.wallet?.address
                        ? `${user.wallet.address.slice(
                            0,
                            4
                          )}...${user.wallet.address.slice(-5)}`
                        : ""}
                    </span>
                  </DropdownMenuItem>
                  {hasEmbeddedWallet && (
                    <DropdownMenuItem
                      onClick={exportWallet}
                      className="cursor-pointer"
                    >
                      <ShieldWarning className="mr-2 w-4 h-4" />
                      <span>Export Private Key</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={logout} className="cursor-pointer">
                    <SignOut className="mr-2 w-4 h-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                disabled={disableLogin}
                onClick={login}
                className="ml-auto text-white bg-transparent rounded-xl transition-all duration-300 ease-in-out cursor-pointer gradient-button"
              >
                <Wallet color="#f39c12" weight="duotone" /> Connect
              </Button>
            )}
          </div>
        </div>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
            />
          )}
        </AnimatePresence>
      </nav>
      <div className="h-24 md:h-28" />
    </>
  );
}
