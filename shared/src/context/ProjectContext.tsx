import { createContext, useContext, useCallback, useMemo } from 'react'
import { useGetProjectQuery } from '@shared/api';

import type { FolderType, ProductTypeOverride } from '@shared/api';


export interface ProjectContextProps {
  name: string;
  project: any;
  isLoading: boolean;
  error: any;

  //
  // ANATOMY
  //

  // Folder types

  folderTypes: FolderType[];
  getFolderType?: (name: string) => FolderType | undefined;

  // Product types

  productTypes: ProductTypeOverride[];
  getProductTypeIcon: (productType: string, baseType?: string) => string;
  getProductTypeColor: (productType: string) => string | undefined;
  getProductTypeOptions: () => { value: string; label: string, icon?: string, color?: string }[];

}

const ProjectContext = createContext<ProjectContextProps | undefined>(undefined);


//
// ProjectProvider
//

interface ProjectProviderProps {
  projectName: string;
  children: React.ReactNode;
}


export const ProjectContextProvider: React.FC<ProjectProviderProps> = ({ projectName, children }: ProjectProviderProps) => {
  const { data: project, isLoading, error } = useGetProjectQuery({ projectName });

  // Shorthands to access project data and type casting
  // (we're referencing nested objects. no need to use useMemo for these)

  const productTypes: ProductTypeOverride[] = // i hate typescript
    (project?.config as { productTypes?: { default: ProductTypeOverride[] } })?.productTypes?.default || [];

  //
  // Magic functions
  //

  // Folder types


  const getFolderType = useCallback((name: string): FolderType | undefined => {
    return project?.folderTypes?.find((type: FolderType) => type.name === name);
  }, [project]);

  // Product types

  const getProductTypeIcon = useCallback((productType: string, baseType?: string): string => {
    if (!productType) return '';
    const type = productTypes.find((type) => type.name === productType);
    if (type) {
      return type.icon || '';
    }
    return baseType || '';
  }, [productTypes]);

  const getProductTypeColor = useCallback((productType: string): string => {
    if (!productType) return '';
    const type = productTypes.find((type) => type.name === productType);
    if (type) {
      return type.color || '';
    }
    return '';
  }, [productTypes]);


  const getProductTypeOptions = useCallback((): { value: string; label: string, icon: string }[] => {
    // Return a list of product type ready to be used in a select input
    const result = productTypes.map((type) => ({
      value: type.name,
      label: type.name,
      icon: type.icon || '',
      color: type.color,
    }));
    console.log('getProductTypeOptions', result);
    return result;
  }, [productTypes]);


  //
  // Put everything together
  //

  const functions = {
    getFolderType,
    getProductTypeIcon,
    getProductTypeColor,
    getProductTypeOptions,
  }

  const value = useMemo(() => ({
    name: projectName,
    project,
    folderTypes: project?.folderTypes || [],
    productTypes,
    isLoading,
    error,
  }), [project, isLoading, error]);


  return (
    <ProjectContext.Provider value={{ ...value, ...functions }}>
      {children}
    </ProjectContext.Provider>
  );
};



export const useProjectContext = () => {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProviderContext')
  }
  return context
}
