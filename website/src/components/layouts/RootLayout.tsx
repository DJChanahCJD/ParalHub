import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from '@radix-ui/react-tooltip'
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      {children}
      <Toaster />
    </TooltipProvider>
  )
}