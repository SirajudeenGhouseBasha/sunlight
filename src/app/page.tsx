"use client"

import { supabase } from "../lib/supabase/client"

export default function Home() {
  const test = async () => {
    const { data, error } = await supabase.auth.getSession()
    console.log(data, error)
  }

  return (
    <div className="p-10">
      <button onClick={test}>Test Supabase</button>
    </div>
  )
}