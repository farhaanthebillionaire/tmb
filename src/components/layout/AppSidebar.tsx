// src/components/layout/AppSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Utensils,
  Smile,
  Brain,
  Trophy,
  BarChart3,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  UserCircle,
  UtensilsCrossedIcon,
  Loader2,
  PanelLeftOpen,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFoodLog } from '@/contexts/FoodLogContext'; 
import React, { useEffect } from 'react'; 

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/dashboard/log-food', label: 'Meal Entry', icon: <Utensils className="h-5 w-5" /> },
  { href: '/dashboard/mood', label: 'Track Mood', icon: <Smile className="h-5 w-5" /> },
  { href: '/dashboard/analyze-plate', label: 'AI Plate Analyzer', icon: <Sparkles className="h-5 w-5" /> },
  { href: '/dashboard/insights', label: 'AI Insights', icon: <Brain className="h-5 w-5" /> },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: <Trophy className="h-5 w-5" /> },
  { href: '/dashboard/reports', label: 'Reports', icon: <BarChart3 className="h-5 w-5" /> },
];

const settingsMenuItem = { href: '/dashboard/settings', label: 'Profile & Settings', icon: <Settings className="h-5 w-5" /> };

export function AppSidebar() {
  const pathname = usePathname();
  const { state, toggleSidebar, isMobile, openMobile, isMounted, defaultOpen } = useSidebar();
  const { currentUser, isLoadingAuth } = useFoodLog(); 

  useEffect(() => {
    console.log('[AppSidebar] Render. isLoadingAuth:', isLoadingAuth, 'currentUser UID:', currentUser?.uid);
  }, [isLoadingAuth, currentUser]);


  const isActive = (href: string) => pathname === href;
  
  const currentLogicalState = isMounted ? (isMobile ? (openMobile ? "expanded" : "collapsed") : state) : (defaultOpen ? "expanded" : "collapsed");

  // Safer derivation of user details
  let userName = 'User';
  let userEmail = 'No email available';
  let userAvatar: string | undefined | null = null;

  if (currentUser) {
    userName = currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'User');
    userEmail = currentUser.email || 'No email available';
    userAvatar = currentUser.photoURL;
  }

  return (
    <Sidebar collapsible="icon" side="left" variant="sidebar" className="border-r" defaultOpen={defaultOpen}>
      <SidebarHeader className="p-3 md:p-4 flex items-center justify-between relative">
        <Link href="/dashboard" className="flex items-center gap-2 flex-grow overflow-hidden" aria-label="TrackMyBite Home">
          <UtensilsCrossedIcon className="h-7 w-7 text-primary flex-shrink-0" />
          <span
            className={`font-bold text-xl text-primary transition-opacity duration-300 whitespace-nowrap ${
              currentLogicalState === 'collapsed' && !isMobile ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 w-auto'
            }`}
          >
            TrackMyBite
          </span>
        </Link>
        {/* Desktop sidebar collapse/expand button - hide on mobile */}
        {!isMobile && (
           <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0" 
            onClick={toggleSidebar}
            aria-label={currentLogicalState === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {currentLogicalState === 'expanded' ? <ChevronsLeft className="h-5 w-5"/> : <ChevronsRight className="h-5 w-5"/>}
          </Button>
        )}
      </SidebarHeader>

      <SidebarContent className="flex-grow p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                tooltip={item.label}
                size="default"
              >
                <Link href={item.href}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 space-y-2">
        {isLoadingAuth ? (
          <div className={`p-2 rounded-md bg-sidebar-accent/50 flex items-center gap-3 ${currentLogicalState === 'collapsed' && !isMobile ? 'w-9 h-9 justify-center mx-auto' : ''}`}>
            <Loader2 className="h-6 w-6 animate-spin text-sidebar-foreground" />
            {currentLogicalState === 'expanded' && <span className="text-sm text-sidebar-foreground/70">Loading...</span>}
          </div>
        ) : currentUser ? (
          <div className={`p-2 rounded-md bg-sidebar-accent/50 ${currentLogicalState === 'collapsed' && !isMobile ? 'w-9 h-9 flex items-center justify-center mx-auto' : 'flex items-center gap-3'}`}>
            <Avatar className="h-8 w-8 flex-shrink-0" key={currentUser.uid + (userAvatar || '')}>
              <AvatarImage src={userAvatar || `https://avatar.vercel.sh/${userName}.png?size=32`} alt={userName} data-ai-hint="user avatar"/>
              <AvatarFallback>{userName ? userName.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
            </Avatar>
            <div className={`overflow-hidden transition-all duration-300 ${currentLogicalState === 'collapsed' && !isMobile ? 'w-0 opacity-0 h-0 pointer-events-none' : 'w-auto opacity-100 h-auto'}`}>
              <p className="text-sm font-medium text-sidebar-foreground truncate" title={userName}>{userName}</p>
              <p className="text-xs text-sidebar-foreground/70 truncate" title={userEmail}>{userEmail}</p>
            </div>
          </div>
        ) : (
           <div className={`p-2 rounded-md bg-sidebar-accent/50 ${currentLogicalState === 'collapsed' && !isMobile ? 'w-9 h-9 flex items-center justify-center mx-auto' : 'flex items-center gap-3'}`}>
             <UserCircle className="h-8 w-8 text-sidebar-foreground/70 flex-shrink-0" />
             {currentLogicalState === 'expanded' &&  <span className="text-sm text-sidebar-foreground/70">Not logged in</span>}
           </div>
        )}
        
        <div className="flex flex-col gap-1">
          {currentUser && (
            <SidebarMenu>
             <SidebarMenuItem>
              <SidebarMenuButton
                  asChild
                  isActive={isActive(settingsMenuItem.href)}
                  tooltip={settingsMenuItem.label}
                  size="default"
              >
                <Link href={settingsMenuItem.href}>
                  {settingsMenuItem.icon}
                  <span>{settingsMenuItem.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            </SidebarMenu>
          )}

          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={currentUser ? "Logout" : "Login"} size="default">
                <Link href={currentUser ? "/login?logout=true" : "/login"}> 
                  <LogOut className="h-5 w-5" />
                  <span>{currentUser ? "Logout" : "Login"}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
