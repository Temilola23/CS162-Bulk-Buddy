import { createContext, useContext, useMemo } from "react";
import ApiClient from "../ApiClient";

/**
 * Context for sharing the API client across the component tree.
 */
const ApiContext = createContext();

/**
 * Provider component that creates and shares a ApiClient instance.
 *
 */
export default function ApiProvider({ children }) {
  // wrap api client in useMemo to avoid multiple instantiations
  const api = useMemo(() => new ApiClient(), []); 

  return (
    <ApiContext.Provider value={api}>
      {children}
    </ApiContext.Provider>
  );
}

/**
 * Hook to access the ApiClient API instance.
 *
 * @returns {ApiClient} The shared API client for making backend requests
 */
export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
}