import { createContext, useContext, useCallback, useMemo } from 'react'
import { ProductType, useGetProjectQuery } from '@shared/api';


import type { FolderType } from '@shared/api/generated/projects';


interface ProjectContextProps {
  name: string;
  project: any;
  isLoading: boolean;
  error: any;

  //
  // ANATOMY
  //

  // Folder types

  folderTypes?: FolderType[];
  getFolderType?: (name: string) => FolderType | undefined;
  getProductTypeIcon: (productType: string, baseType?: string ) => string;
  getProductTypeOptions?: () => { value: string; label: string, icon: string }[];

  // Product types


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

  const productTypes: ProductType[] = // i hate typescript
    (project?.config as { product_types?: { default: ProductType[] } })?.product_types?.default || [];  

  
  //
  // Magic functions
  //


  const getFolderType = useCallback((name: string): FolderType | undefined => {
    return project?.folderTypes?.find((type: FolderType) => type.name === name);
  }, [project]);


  const getProductTypeIcon = useCallback((productType: string, baseType?: string): string => {
    if (!productType) return '';
    const type = productTypes.find((type) => type.name === productType);
    if (type) {
      return type.icon || '';
    }
    return baseType || '';
  }, [productTypes]);


  const getProductTypeOptions = useCallback((): { value: string; label: string, icon: string }[] => {
    // Return a list of product type ready to be used in a select input
    return productTypes.map((type) => ({
      value: type.name,
      label: type.name,
      icon: type.icon || '',
    }));
  }, [productTypes]);


  //
  // Put everything together
  //

  const functions = {
    getFolderType,
    getProductTypeIcon,
    getProductTypeOptions,
  }

  const value = useMemo(() => ({
    name: projectName,
    project,
    folderTypes: project?.folderTypes || [],
    isLoading,
    error,
  }), [project, isLoading, error]);


  return (
    <ProjectContext.Provider value={{...value, ...functions}}>
      {children}
    </ProjectContext.Provider>
  );
};



export const useProjectContext = () => {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}
