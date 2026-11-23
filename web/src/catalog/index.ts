import { createComponentImplementation, type ReactCatalogComponent } from "@a2ui/react";
import {
  Catalog,
  type CatalogApi,
  type ComponentApi,
  type FunctionApi,
  type FunctionImplementation,
} from "@a2ui/web_core/v1_0";
import { basicCatalog } from "@a2ui/web_core/catalogs/basic/v1";
import { TUTOR_VIEWS } from "./components";
import catalogDocument from "./tutor_catalog.json";

export type CatalogDocument = { catalogId: string; components: Record<string, unknown> } & Record<
  string,
  unknown
>;

/**
 * The renderer's catalog. Throws if the JSON catalog offers a component nothing here can draw:
 * a catalog must never promise the agent something the client cannot show.
 */
export function createTutorCatalog(
  document: CatalogDocument = catalogDocument as unknown as CatalogDocument,
): Catalog<ReactCatalogComponent, FunctionImplementation> {
  const schemas: CatalogApi = Catalog.fromJson(document);
  const components: ReactCatalogComponent[] = [...schemas.components.entries()].map(
    ([name, api]) => {
      const fromSdk = basicCatalog.components.get(name);
      if (fromSdk) return fromSdk;
      const view = TUTOR_VIEWS[name];
      if (!view) throw new Error(`The catalog offers ${name}, and nothing here draws it.`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return createComponentImplementation(api, view as any);
    },
  );
  return (schemas as Catalog<ComponentApi, FunctionApi>).withEntries(
    components,
    [],
  ) as unknown as Catalog<ReactCatalogComponent, FunctionImplementation>;
}

export const TUTOR_CATALOG_ID: string = catalogDocument.catalogId;
export const tutorComponentNames = () => Object.keys(TUTOR_VIEWS);
