"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/core/utils/supabase/server";
import { db } from "@/core/db";
import { loginSchema } from "./schemas";

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password } = parsed.data;
  const supabase = await createClient();

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Ensure a corresponding User row exists in the database
  if (data.user) {
    await db.user.upsert({
      where: { auth_id: data.user.id },
      update: { email: data.user.email ?? email },
      create: {
        auth_id: data.user.id,
        email: data.user.email ?? email,
      },
    });
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const dbUser = await db.user.findUnique({
    where: { auth_id: user.id },
    select: {
      user_id: true,
      email: true,
      role: true,
    },
  });

  return dbUser;
}
