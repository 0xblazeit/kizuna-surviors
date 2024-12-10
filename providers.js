"use client";

import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }) {
    const [queryClient] = useState(() => new QueryClient({}));

    const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

    if (!privyAppId) {
        throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is not set in the environment variables");
    }

    return (
        <PrivyProvider
            appId={privyAppId}
            config={{
                appearance: {
                    theme: 'dark',
                    accentColor: '#f39c12',
                    logo: process.env.NODE_ENV === 'development' ? 'http://localhost:3000/kizuna-logo-combo.png' : `${process.env.NEXT_PUBLIC_APP_URL}/kizuna-logo-combo.png`,
                },
                embeddedWallets: {
                    createOnLogin: 'users-without-wallets' // defaults to 'off'
                }
            }}
        >
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </PrivyProvider>
    );
}
