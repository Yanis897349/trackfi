"use client"

import * as React from "react"

export interface UiText {
  close: string
  sidebarDescription: string
  sidebarTitle: string
  toggleSidebar: string
}

const defaultText: UiText = {
  close: "Close",
  sidebarDescription: "Displays the mobile sidebar.",
  sidebarTitle: "Sidebar",
  toggleSidebar: "Toggle sidebar",
}

const UiTextContext = React.createContext<UiText>(defaultText)

export function UiTextProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: UiText
}) {
  return (
    <UiTextContext.Provider value={value}>{children}</UiTextContext.Provider>
  )
}

export function useUiText() {
  return React.useContext(UiTextContext)
}
