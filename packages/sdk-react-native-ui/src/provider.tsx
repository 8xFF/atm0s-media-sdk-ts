import { ReactNode, createContext, useEffect, useMemo } from "react";
import { Context } from "./context";

export const Atm0sMediaUIContext = createContext<Context>({} as any);

interface Props {
  children: ReactNode;
}

export function Atm0sMediaUIProvider({ children }: Props) {
  const context = useMemo(() => new Context(), []);
  useEffect(() => {
    return () => {};
  }, [context]);

  return (
    <Atm0sMediaUIContext.Provider value={context}>
      {children}
    </Atm0sMediaUIContext.Provider>
  );
}
