import { createContext, useContext } from "react";
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
  const api = new ApiClient();

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
  return useContext(ApiContext);
}