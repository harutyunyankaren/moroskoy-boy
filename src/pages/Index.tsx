import type React from "react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const onPointerMove = (e: React.MouseEvent) => {
    const el = surfaceRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--pointer-x", `${x}%`);
    el.style.setProperty("--pointer-y", `${y}%`);
  };

  useEffect(() => {
    document.title = "Ծովային պատերազմներ — Battleship առցանց խաղ";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Խաղա Ծովային պատերազմներ (Battleship) օնլայն՝ խփիր նավերին և հաղթիր։');
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <section
        ref={surfaceRef}
        onMouseMove={onPointerMove}
        className="surface-gradient border border-border rounded-2xl p-8 sm:p-12 max-w-4xl mx-4 text-center"
      >
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">Ծովային պատերազմներ — Battleship</h1>
        <p className="text-lg text-muted-foreground mb-8">Դիր նավերդ, գուշակիր կոորդինատները և խորտակիր թշնամուն։ Պատրաստ ես մարտի՞։</p>
        <div className="flex items-center justify-center gap-4">
          <a href="/battleship" aria-label="Սկսել խաղը">
            <Button variant="hero" size="lg">Սկսել խաղը</Button>
          </a>
        </div>
      </section>
    </main>
  );
};

export default Index;
