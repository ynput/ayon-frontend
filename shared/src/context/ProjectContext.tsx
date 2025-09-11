import { createContext, useContext, useCallback, useMemo } from 'react'
import { useGetProjectQuery, useGetProductTypesQuery } from '@shared/api';

import type { FolderType, TaskType, ProductTypeListItem, DefaultProductType } from '@shared/api';


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

  taskTypes?: TaskType[];

  // Product types

  productTypes: ProductTypeListItem[];
  defaultProductType?: DefaultProductType;
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
  const { data: productTypesData } = useGetProductTypesQuery({ projectName });

  // Shorthands to access project data and type casting
  // (we're referencing nested objects. no need to use useMemo for these)

  const productTypes = productTypesData?.productTypes || [];
  const defaultProductType = productTypesData?.default;
  //
  // Magic functions
  //

  // Folder types


  const getFolderType = useCallback((name: string): FolderType | undefined => {
    return project?.folderTypes?.find((type: FolderType) => type.name === name);
  }, [project]);

  // Task types
  
  const getTaskType = useCallback((name: string): TaskType | undefined => {
    return project?.taskTypes?.find((type: TaskType) => type.name === name);
  }, [project]);

  // Product types

  const getProductTypeIcon = useCallback((productType: string, baseProductType?: string): string => {
    if (!productType) return '';
    const type = productTypes.find((type) => type.name === productType);
    if (type) {
      return type.icon || '';
    }
    return defaultProductType?.icon || '';
  }, [productTypes]);

  const getProductTypeColor = useCallback((productType: string, baseProductType?: string): string | undefined => {
    if (!productType) return;
    const type = productTypes.find((type) => type.name === productType);
    if (type) {
      return type.color;
    }
    return defaultProductType?.color;
  }, [productTypes]);


  const getProductTypeOptions = useCallback((): { value: string; label: string, icon: string }[] => {
    // Return a list of product type ready to be used in a select input
    const result = productTypes.map((type) => ({
      value: type.name,
      label: type.name,
      icon: type.icon || defaultProductType?.icon || '',
      color: type.color || defaultProductType?.color || '',
    }));
    return result;
  }, [productTypes]);


  //
  // Put everything together
  //

  const functions = {
    getFolderType,
    getTaskType,
    getProductTypeIcon,
    getProductTypeColor,
    getProductTypeOptions,
  }

  const value = useMemo(() => ({
    name: projectName,
    project,
    folderTypes: project?.folderTypes || [],
    taskTypes: project?.taskTypes || [],
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
