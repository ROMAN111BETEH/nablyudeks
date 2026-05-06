"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/components/admin/admin.module.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
    });

    if (!response.ok) {
      setError("Неверный логин или пароль");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <main className={styles.loginPage}>
      <form className={styles.loginCard} onSubmit={handleSubmit}>
        <h1>Вход в админку</h1>

        <label>
          Логин
          <input value={login} onChange={(e) => setLogin(e.target.value)} required />
        </label>

        <label>
          Пароль
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        {error && <p className={styles.errorText}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Проверяем..." : "Войти"}
        </button>
      </form>
    </main>
  );
}
