"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut, ChevronDown } from "lucide-react"
import { useProfile } from "@/hooks/use-profile"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import randomProfile from 'random-profile-generator';

interface UserProfileSectionProps {
  onLogout: () => void;
}

export function UserProfileSection({ onLogout }: UserProfileSectionProps) {
  const { profile, isLoading } = useProfile()
  const [randomUserData, setRandomUserData] = useState({
    fullName: "",
    avatar: "",
  });

  useEffect(() => {
    if (!profile?.full_name) {
      const newRandomProfile = randomProfile.profile();
      setRandomUserData({
        fullName: newRandomProfile.fullName,
        avatar: newRandomProfile.avatar,
      });
    }
  }, [profile]);

  // const [isLoggingOut, setIsLoggingOut] = useState(false) // No longer needed here
  // const router = useRouter()
  // const { toast } = useToast()

  // const handleLogout = async () => { // Moved to parent
  //   setIsLoggingOut(true)
  //   try {
  //     const supabase = createClient()
  //     const { error } = await supabase.auth.signOut()

  //     if (error) throw error

  //     router.push("/auth/login")
  //   } catch (error) {
  //     toast({
  //       title: "Error",
  //       description: "Failed to log out. Please try again.",
  //       variant: "destructive",
  //     })
  //   } finally {
  //     setIsLoggingOut(false)
  //   }
  // }

  if (isLoading) {
    return (
      <div className="p-4  border-t border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          <div className="flex-1">
            <div className="h-3 bg-muted rounded animate-pulse mb-1" />
            <div className="h-2 bg-muted rounded animate-pulse w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : (randomUserData.fullName ? randomUserData.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase() : "U");

  return (
    <div className="user-profile-section p-2 border-t border-sidebar-border/50 relative z-50">
        <Button
            variant="ghost"
            className="w-full flex items-center gap-3 px-3 py-2 h-auto hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile?.avatar_url || randomUserData.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 w-16 text-left flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-sidebar-foreground">
                  {profile?.full_name || randomUserData.fullName || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Free
                </p>
              </div>
            <div className="w-16">
            <Button variant="secondary" size="sm" className="h-7 text-xs">
                Upgrade
              </Button>
            </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
    </div>
  )
}