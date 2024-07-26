import { RestAPI as api } from '../services/ayon'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAccessGroupSchema: build.query<GetAccessGroupSchemaApiResponse, GetAccessGroupSchemaApiArg>({
      query: () => ({ url: `/api/accessGroups/_schema` }),
    }),
    getAccessGroups: build.query<GetAccessGroupsApiResponse, GetAccessGroupsApiArg>({
      query: (queryArg) => ({ url: `/api/accessGroups/${queryArg.projectName}` }),
    }),
    getAccessGroup: build.query<GetAccessGroupApiResponse, GetAccessGroupApiArg>({
      query: (queryArg) => ({
        url: `/api/accessGroups/${queryArg.accessGroupName}/${queryArg.projectName}`,
      }),
    }),
    saveAccessGroup: build.mutation<SaveAccessGroupApiResponse, SaveAccessGroupApiArg>({
      query: (queryArg) => ({
        url: `/api/accessGroups/${queryArg.accessGroupName}/${queryArg.projectName}`,
        method: 'PUT',
        body: queryArg.data,
      }),
    }),
    deleteAccessGroup: build.mutation<DeleteAccessGroupApiResponse, DeleteAccessGroupApiArg>({
      query: (queryArg) => ({
        url: `/api/accessGroups/${queryArg.accessGroupName}/${queryArg.projectName}`,
        method: 'DELETE',
      }),
    }),
    listAvailableActionsForContext: build.mutation<
      ListAvailableActionsForContextApiResponse,
      ListAvailableActionsForContextApiArg
    >({
      query: (queryArg) => ({
        url: `/api/actions/list`,
        method: 'POST',
        body: queryArg.actionContext,
        params: { mode: queryArg.mode },
      }),
    }),
    listAllActions: build.query<ListAllActionsApiResponse, ListAllActionsApiArg>({
      query: () => ({ url: `/api/actions/manage` }),
    }),
    executeAction: build.mutation<ExecuteActionApiResponse, ExecuteActionApiArg>({
      query: (queryArg) => ({
        url: `/api/actions/execute`,
        method: 'POST',
        body: queryArg.actionContext,
        params: {
          addonName: queryArg.addonName,
          addonVersion: queryArg.addonVersion,
          variant: queryArg.variant,
          identifier: queryArg.identifier,
        },
      }),
    }),
    takeAction: build.query<TakeActionApiResponse, TakeActionApiArg>({
      query: (queryArg) => ({ url: `/api/actions/take/${queryArg.token}` }),
    }),
    postProjectActivity: build.mutation<PostProjectActivityApiResponse, PostProjectActivityApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/${queryArg.entityType}/${queryArg.entityId}/activities`,
        method: 'POST',
        body: queryArg.projectActivityPostModel,
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    deleteProjectActivity: build.mutation<
      DeleteProjectActivityApiResponse,
      DeleteProjectActivityApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/activities/${queryArg.activityId}`,
        method: 'DELETE',
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    patchProjectActivity: build.mutation<
      PatchProjectActivityApiResponse,
      PatchProjectActivityApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/activities/${queryArg.activityId}`,
        method: 'PATCH',
        body: queryArg.activityPatchModel,
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    suggestEntityMention: build.mutation<
      SuggestEntityMentionApiResponse,
      SuggestEntityMentionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/suggest`,
        method: 'POST',
        body: queryArg.suggestRequest,
      }),
    }),
    getEntityWatchers: build.query<GetEntityWatchersApiResponse, GetEntityWatchersApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/${queryArg.entityType}/${queryArg.entityId}/watchers`,
      }),
    }),
    setEntityWatchers: build.mutation<SetEntityWatchersApiResponse, SetEntityWatchersApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/${queryArg.entityType}/${queryArg.entityId}/watchers`,
        method: 'POST',
        body: queryArg.watchersModel,
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    deleteAddon: build.mutation<DeleteAddonApiResponse, DeleteAddonApiArg>({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}`,
        method: 'DELETE',
        params: { purge: queryArg.purge },
      }),
    }),
    deleteAddonVersion: build.mutation<DeleteAddonVersionApiResponse, DeleteAddonVersionApiArg>({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}`,
        method: 'DELETE',
        params: { purge: queryArg.purge },
      }),
    }),
    getInstalledAddonsList: build.query<
      GetInstalledAddonsListApiResponse,
      GetInstalledAddonsListApiArg
    >({
      query: () => ({ url: `/api/addons/install` }),
    }),
    uploadAddonZipFile: build.mutation<UploadAddonZipFileApiResponse, UploadAddonZipFileApiArg>({
      query: (queryArg) => ({
        url: `/api/addons/install`,
        method: 'POST',
        params: {
          url: queryArg.url,
          addonName: queryArg.addonName,
          addonVersion: queryArg.addonVersion,
        },
      }),
    }),
    getAddonProjectSettingsSchema: build.query<
      GetAddonProjectSettingsSchemaApiResponse,
      GetAddonProjectSettingsSchemaApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.version}/schema/${queryArg.projectName}`,
        params: { variant: queryArg.variant, site_id: queryArg.siteId },
      }),
    }),
    getAddonProjectSettings: build.query<
      GetAddonProjectSettingsApiResponse,
      GetAddonProjectSettingsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.version}/settings/${queryArg.projectName}`,
        params: { variant: queryArg.variant, as: queryArg['as'], site_id: queryArg.siteId },
      }),
    }),
    setAddonProjectSettings: build.mutation<
      SetAddonProjectSettingsApiResponse,
      SetAddonProjectSettingsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.version}/settings/${queryArg.projectName}`,
        method: 'POST',
        body: queryArg.payload,
        params: { variant: queryArg.variant, site_id: queryArg.siteId },
      }),
    }),
    getAddonProjectOverrides: build.query<
      GetAddonProjectOverridesApiResponse,
      GetAddonProjectOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.version}/overrides/${queryArg.projectName}`,
        params: { variant: queryArg.variant, as: queryArg['as'], site_id: queryArg.siteId },
      }),
    }),
    modifyProjectOverrides: build.mutation<
      ModifyProjectOverridesApiResponse,
      ModifyProjectOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.version}/overrides/${queryArg.projectName}`,
        method: 'POST',
        body: queryArg.modifyOverridesRequestModel,
        params: { variant: queryArg.variant, site_id: queryArg.siteId },
      }),
    }),
    deleteAddonProjectOverrides: build.mutation<
      DeleteAddonProjectOverridesApiResponse,
      DeleteAddonProjectOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.version}/overrides/${queryArg.projectName}`,
        method: 'DELETE',
        params: { variant: queryArg.variant, site_id: queryArg.siteId },
      }),
    }),
    getRawAddonProjectOverrides: build.query<
      GetRawAddonProjectOverridesApiResponse,
      GetRawAddonProjectOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}/rawOverrides/${queryArg.projectName}`,
        params: { variant: queryArg.variant, site_id: queryArg.siteId },
      }),
    }),
    setRawAddonProjectOverrides: build.mutation<
      SetRawAddonProjectOverridesApiResponse,
      SetRawAddonProjectOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}/rawOverrides/${queryArg.projectName}`,
        method: 'PUT',
        body: queryArg.payload,
        params: { variant: queryArg.variant, site_id: queryArg.siteId },
      }),
    }),
    getAddonSiteSettingsSchema: build.query<
      GetAddonSiteSettingsSchemaApiResponse,
      GetAddonSiteSettingsSchemaApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.version}/siteSettings/schema`,
      }),
    }),
    getAddonSiteSettings: build.query<GetAddonSiteSettingsApiResponse, GetAddonSiteSettingsApiArg>({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.version}/siteSettings`,
        params: { site_id: queryArg.siteId },
      }),
    }),
    setAddonSiteSettings: build.mutation<
      SetAddonSiteSettingsApiResponse,
      SetAddonSiteSettingsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.version}/siteSettings`,
        method: 'PUT',
        body: queryArg.payload,
        params: { site_id: queryArg.siteId },
      }),
    }),
    getAddonSettingsSchema: build.query<
      GetAddonSettingsSchemaApiResponse,
      GetAddonSettingsSchemaApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}/schema`,
        params: { variant: queryArg.variant },
      }),
    }),
    getAddonStudioSettings: build.query<
      GetAddonStudioSettingsApiResponse,
      GetAddonStudioSettingsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}/settings`,
        params: { variant: queryArg.variant, as: queryArg['as'] },
      }),
    }),
    setAddonStudioSettings: build.mutation<
      SetAddonStudioSettingsApiResponse,
      SetAddonStudioSettingsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}/settings`,
        method: 'POST',
        body: queryArg.payload,
        params: { variant: queryArg.variant },
      }),
    }),
    getAddonStudioOverrides: build.query<
      GetAddonStudioOverridesApiResponse,
      GetAddonStudioOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}/overrides`,
        params: { variant: queryArg.variant, as: queryArg['as'] },
      }),
    }),
    modifyStudioOverrides: build.mutation<
      ModifyStudioOverridesApiResponse,
      ModifyStudioOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}/overrides`,
        method: 'POST',
        body: queryArg.modifyOverridesRequestModel,
        params: { variant: queryArg.variant },
      }),
    }),
    deleteAddonStudioOverrides: build.mutation<
      DeleteAddonStudioOverridesApiResponse,
      DeleteAddonStudioOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}/overrides`,
        method: 'DELETE',
        params: { variant: queryArg.variant },
      }),
    }),
    getRawAddonStudioOverrides: build.query<
      GetRawAddonStudioOverridesApiResponse,
      GetRawAddonStudioOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}/rawOverrides`,
        params: { variant: queryArg.variant },
      }),
    }),
    setRawAddonStudioOverrides: build.mutation<
      SetRawAddonStudioOverridesApiResponse,
      SetRawAddonStudioOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}/rawOverrides`,
        method: 'PUT',
        body: queryArg.payload,
        params: { variant: queryArg.variant },
      }),
    }),
    listAddons: build.query<ListAddonsApiResponse, ListAddonsApiArg>({
      query: (queryArg) => ({ url: `/api/addons`, params: { details: queryArg.details } }),
    }),
    configureAddons: build.mutation<ConfigureAddonsApiResponse, ConfigureAddonsApiArg>({
      query: (queryArg) => ({
        url: `/api/addons`,
        method: 'POST',
        body: queryArg.addonConfigRequest,
      }),
    }),
    getAnatomySchema: build.query<GetAnatomySchemaApiResponse, GetAnatomySchemaApiArg>({
      query: () => ({ url: `/api/anatomy/schema` }),
    }),
    getAnatomyPresets: build.query<GetAnatomyPresetsApiResponse, GetAnatomyPresetsApiArg>({
      query: () => ({ url: `/api/anatomy/presets` }),
    }),
    getAnatomyPreset: build.query<GetAnatomyPresetApiResponse, GetAnatomyPresetApiArg>({
      query: (queryArg) => ({ url: `/api/anatomy/presets/${queryArg.presetName}` }),
    }),
    updateAnatomyPreset: build.mutation<UpdateAnatomyPresetApiResponse, UpdateAnatomyPresetApiArg>({
      query: (queryArg) => ({
        url: `/api/anatomy/presets/${queryArg.presetName}`,
        method: 'PUT',
        body: queryArg.anatomy,
      }),
    }),
    deleteAnatomyPreset: build.mutation<DeleteAnatomyPresetApiResponse, DeleteAnatomyPresetApiArg>({
      query: (queryArg) => ({
        url: `/api/anatomy/presets/${queryArg.presetName}`,
        method: 'DELETE',
      }),
    }),
    setPrimaryPreset: build.mutation<SetPrimaryPresetApiResponse, SetPrimaryPresetApiArg>({
      query: (queryArg) => ({
        url: `/api/anatomy/presets/${queryArg.presetName}/primary`,
        method: 'POST',
      }),
    }),
    unsetPrimaryPreset: build.mutation<UnsetPrimaryPresetApiResponse, UnsetPrimaryPresetApiArg>({
      query: (queryArg) => ({
        url: `/api/anatomy/presets/${queryArg.presetName}/primary`,
        method: 'DELETE',
      }),
    }),
    getAttributeList: build.query<GetAttributeListApiResponse, GetAttributeListApiArg>({
      query: () => ({ url: `/api/attributes` }),
    }),
    setAttributeList: build.mutation<SetAttributeListApiResponse, SetAttributeListApiArg>({
      query: (queryArg) => ({
        url: `/api/attributes`,
        method: 'PUT',
        body: queryArg.setAttributeListModel,
      }),
    }),
    getAttributeConfig: build.query<GetAttributeConfigApiResponse, GetAttributeConfigApiArg>({
      query: (queryArg) => ({ url: `/api/attributes/${queryArg.attributeName}` }),
    }),
    setAttributeConfig: build.mutation<SetAttributeConfigApiResponse, SetAttributeConfigApiArg>({
      query: (queryArg) => ({
        url: `/api/attributes/${queryArg.attributeName}`,
        method: 'PUT',
        body: queryArg.attributePutModel,
      }),
    }),
    deleteAttribute: build.mutation<DeleteAttributeApiResponse, DeleteAttributeApiArg>({
      query: (queryArg) => ({ url: `/api/attributes/${queryArg.attributeName}`, method: 'DELETE' }),
    }),
    login: build.mutation<LoginApiResponse, LoginApiArg>({
      query: (queryArg) => ({
        url: `/api/auth/login`,
        method: 'POST',
        body: queryArg.loginRequestModel,
      }),
    }),
    logout: build.mutation<LogoutApiResponse, LogoutApiArg>({
      query: () => ({ url: `/api/auth/logout`, method: 'POST' }),
    }),
    listActiveSessions: build.query<ListActiveSessionsApiResponse, ListActiveSessionsApiArg>({
      query: () => ({ url: `/api/auth/sessions` }),
    }),
    listBundles: build.query<ListBundlesApiResponse, ListBundlesApiArg>({
      query: (queryArg) => ({ url: `/api/bundles`, params: { archived: queryArg.archived } }),
    }),
    createNewBundle: build.mutation<CreateNewBundleApiResponse, CreateNewBundleApiArg>({
      query: (queryArg) => ({
        url: `/api/bundles`,
        method: 'POST',
        body: queryArg.bundleModel,
        headers: { 'x-sender': queryArg['x-sender'] },
        params: { force: queryArg.force },
      }),
    }),
    checkBundleCompatibility: build.mutation<
      CheckBundleCompatibilityApiResponse,
      CheckBundleCompatibilityApiArg
    >({
      query: (queryArg) => ({
        url: `/api/bundles/check`,
        method: 'POST',
        body: queryArg.bundleModel,
      }),
    }),
    bundleActions: build.mutation<BundleActionsApiResponse, BundleActionsApiArg>({
      query: (queryArg) => ({
        url: `/api/bundles/${queryArg.bundleName}`,
        method: 'POST',
        body: queryArg.bundleActionModel,
      }),
    }),
    deleteExistingBundle: build.mutation<
      DeleteExistingBundleApiResponse,
      DeleteExistingBundleApiArg
    >({
      query: (queryArg) => ({ url: `/api/bundles/${queryArg.bundleName}`, method: 'DELETE' }),
    }),
    updateBundle: build.mutation<UpdateBundleApiResponse, UpdateBundleApiArg>({
      query: (queryArg) => ({
        url: `/api/bundles/${queryArg.bundleName}`,
        method: 'PATCH',
        body: queryArg.bundlePatchModel,
        headers: { 'x-sender': queryArg['x-sender'] },
        params: { build: queryArg.build, force: queryArg.force },
      }),
    }),
    getYnputCloudInfo: build.query<GetYnputCloudInfoApiResponse, GetYnputCloudInfoApiArg>({
      query: () => ({ url: `/api/connect` }),
    }),
    setYnputCloudKey: build.mutation<SetYnputCloudKeyApiResponse, SetYnputCloudKeyApiArg>({
      query: (queryArg) => ({
        url: `/api/connect`,
        method: 'POST',
        body: queryArg.ynputConnectRequestModel,
      }),
    }),
    deleteYnputCloudKey: build.mutation<DeleteYnputCloudKeyApiResponse, DeleteYnputCloudKeyApiArg>({
      query: () => ({ url: `/api/connect`, method: 'DELETE' }),
    }),
    connectToYnputCloud: build.query<ConnectToYnputCloudApiResponse, ConnectToYnputCloudApiArg>({
      query: (queryArg) => ({
        url: `/api/connect/authorize`,
        params: { origin_url: queryArg.originUrl },
      }),
    }),
    listDependencyPackages: build.query<
      ListDependencyPackagesApiResponse,
      ListDependencyPackagesApiArg
    >({
      query: () => ({ url: `/api/desktop/dependencyPackages` }),
    }),
    createDependencyPackage: build.mutation<
      CreateDependencyPackageApiResponse,
      CreateDependencyPackageApiArg
    >({
      query: (queryArg) => ({
        url: `/api/desktop/dependencyPackages`,
        method: 'POST',
        body: queryArg.dependencyPackage,
        params: { url: queryArg.url, overwrite: queryArg.overwrite, force: queryArg.force },
      }),
    }),
    downloadDependencyPackage: build.query<
      DownloadDependencyPackageApiResponse,
      DownloadDependencyPackageApiArg
    >({
      query: (queryArg) => ({ url: `/api/desktop/dependencyPackages/${queryArg.filename}` }),
    }),
    uploadDependencyPackage: build.mutation<
      UploadDependencyPackageApiResponse,
      UploadDependencyPackageApiArg
    >({
      query: (queryArg) => ({
        url: `/api/desktop/dependencyPackages/${queryArg.filename}`,
        method: 'PUT',
      }),
    }),
    deleteDependencyPackage: build.mutation<
      DeleteDependencyPackageApiResponse,
      DeleteDependencyPackageApiArg
    >({
      query: (queryArg) => ({
        url: `/api/desktop/dependencyPackages/${queryArg.filename}`,
        method: 'DELETE',
      }),
    }),
    updateDependencyPackage: build.mutation<
      UpdateDependencyPackageApiResponse,
      UpdateDependencyPackageApiArg
    >({
      query: (queryArg) => ({
        url: `/api/desktop/dependencyPackages/${queryArg.filename}`,
        method: 'PATCH',
        body: queryArg.sourcesPatchModel,
      }),
    }),
    listInstallers: build.query<ListInstallersApiResponse, ListInstallersApiArg>({
      query: (queryArg) => ({
        url: `/api/desktop/installers`,
        params: {
          version: queryArg.version,
          platform: queryArg.platform,
          variant: queryArg.variant,
        },
      }),
    }),
    createInstaller: build.mutation<CreateInstallerApiResponse, CreateInstallerApiArg>({
      query: (queryArg) => ({
        url: `/api/desktop/installers`,
        method: 'POST',
        body: queryArg.installer,
        params: { url: queryArg.url, overwrite: queryArg.overwrite, force: queryArg.force },
      }),
    }),
    downloadInstallerFile: build.query<
      DownloadInstallerFileApiResponse,
      DownloadInstallerFileApiArg
    >({
      query: (queryArg) => ({ url: `/api/desktop/installers/${queryArg.filename}` }),
    }),
    uploadInstallerFile: build.mutation<UploadInstallerFileApiResponse, UploadInstallerFileApiArg>({
      query: (queryArg) => ({ url: `/api/desktop/installers/${queryArg.filename}`, method: 'PUT' }),
    }),
    deleteInstallerFile: build.mutation<DeleteInstallerFileApiResponse, DeleteInstallerFileApiArg>({
      query: (queryArg) => ({
        url: `/api/desktop/installers/${queryArg.filename}`,
        method: 'DELETE',
      }),
    }),
    patchInstaller: build.mutation<PatchInstallerApiResponse, PatchInstallerApiArg>({
      query: (queryArg) => ({
        url: `/api/desktop/installers/${queryArg.filename}`,
        method: 'PATCH',
        body: queryArg.sourcesPatchModel,
      }),
    }),
    enroll: build.mutation<EnrollApiResponse, EnrollApiArg>({
      query: (queryArg) => ({
        url: `/api/enroll`,
        method: 'POST',
        body: queryArg.enrollRequestModel,
      }),
    }),
    postEvent: build.mutation<PostEventApiResponse, PostEventApiArg>({
      query: (queryArg) => ({
        url: `/api/events`,
        method: 'POST',
        body: queryArg.dispatchEventRequestModel,
      }),
    }),
    getEvent: build.query<GetEventApiResponse, GetEventApiArg>({
      query: (queryArg) => ({ url: `/api/events/${queryArg.eventId}` }),
    }),
    updateExistingEvent: build.mutation<UpdateExistingEventApiResponse, UpdateExistingEventApiArg>({
      query: (queryArg) => ({
        url: `/api/events/${queryArg.eventId}`,
        method: 'PATCH',
        body: queryArg.updateEventRequestModel,
      }),
    }),
    uploadProjectFile: build.mutation<UploadProjectFileApiResponse, UploadProjectFileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files`,
        method: 'POST',
        headers: {
          'x-file-id': queryArg['x-file-id'],
          'x-file-name': queryArg['x-file-name'],
          'x-activity-id': queryArg['x-activity-id'],
          'content-type': queryArg['content-type'],
        },
      }),
    }),
    getProjectFile: build.query<GetProjectFileApiResponse, GetProjectFileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}`,
      }),
    }),
    deleteProjectFile: build.mutation<DeleteProjectFileApiResponse, DeleteProjectFileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}`,
        method: 'DELETE',
      }),
    }),
    getProjectFileHead: build.mutation<GetProjectFileHeadApiResponse, GetProjectFileHeadApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}`,
        method: 'HEAD',
      }),
    }),
    getProjectFileThumbnail: build.query<
      GetProjectFileThumbnailApiResponse,
      GetProjectFileThumbnailApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}/thumbnail`,
      }),
    }),
    getFolder: build.query<GetFolderApiResponse, GetFolderApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders/${queryArg.folderId}`,
      }),
    }),
    deleteFolder: build.mutation<DeleteFolderApiResponse, DeleteFolderApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders/${queryArg.folderId}`,
        method: 'DELETE',
        headers: { 'x-sender': queryArg['x-sender'] },
        params: { force: queryArg.force },
      }),
    }),
    updateFolder: build.mutation<UpdateFolderApiResponse, UpdateFolderApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders/${queryArg.folderId}`,
        method: 'PATCH',
        body: queryArg.folderPatchModel,
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    getFolderList: build.query<GetFolderListApiResponse, GetFolderListApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders`,
        params: { attrib: queryArg.attrib },
      }),
    }),
    createFolder: build.mutation<CreateFolderApiResponse, CreateFolderApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders`,
        method: 'POST',
        body: queryArg.folderPostModel,
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    getFolderHierarchy: build.query<GetFolderHierarchyApiResponse, GetFolderHierarchyApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/hierarchy`,
        params: { search: queryArg.search, types: queryArg.types },
      }),
    }),
    manageInboxItem: build.mutation<ManageInboxItemApiResponse, ManageInboxItemApiArg>({
      query: (queryArg) => ({
        url: `/api/inbox`,
        method: 'POST',
        body: queryArg.manageInboxItemRequest,
      }),
    }),
    listLinkTypes: build.query<ListLinkTypesApiResponse, ListLinkTypesApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/links/types` }),
    }),
    saveLinkType: build.mutation<SaveLinkTypeApiResponse, SaveLinkTypeApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/links/types/${queryArg.linkType}`,
        method: 'PUT',
        body: queryArg.createLinkTypeRequestModel,
      }),
    }),
    deleteLinkType: build.mutation<DeleteLinkTypeApiResponse, DeleteLinkTypeApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/links/types/${queryArg.linkType}`,
        method: 'DELETE',
      }),
    }),
    createEntityLink: build.mutation<CreateEntityLinkApiResponse, CreateEntityLinkApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/links`,
        method: 'POST',
        body: queryArg.createLinkRequestModel,
      }),
    }),
    deleteEntityLink: build.mutation<DeleteEntityLinkApiResponse, DeleteEntityLinkApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/links/${queryArg.linkId}`,
        method: 'DELETE',
      }),
    }),
    marketAddonList: build.query<MarketAddonListApiResponse, MarketAddonListApiArg>({
      query: () => ({ url: `/api/market/addons` }),
    }),
    marketAddonDetail: build.query<MarketAddonDetailApiResponse, MarketAddonDetailApiArg>({
      query: (queryArg) => ({ url: `/api/market/addons/${queryArg.addonName}` }),
    }),
    marketAddonVersionDetail: build.query<
      MarketAddonVersionDetailApiResponse,
      MarketAddonVersionDetailApiArg
    >({
      query: (queryArg) => ({
        url: `/api/market/addons/${queryArg.addonName}/${queryArg.addonVersion}`,
      }),
    }),
    createFirstAdmin: build.mutation<CreateFirstAdminApiResponse, CreateFirstAdminApiArg>({
      query: (queryArg) => ({
        url: `/api/onboarding/initialize`,
        method: 'POST',
        body: queryArg.initializeRequestModel,
      }),
    }),
    abortOnboarding: build.mutation<AbortOnboardingApiResponse, AbortOnboardingApiArg>({
      query: () => ({ url: `/api/onboarding/abort`, method: 'POST' }),
    }),
    restartOnboarding: build.mutation<RestartOnboardingApiResponse, RestartOnboardingApiArg>({
      query: () => ({ url: `/api/onboarding/restart`, method: 'POST' }),
    }),
    getReleases: build.query<GetReleasesApiResponse, GetReleasesApiArg>({
      query: () => ({ url: `/api/onboarding/releases` }),
    }),
    getReleaseInfo: build.query<GetReleaseInfoApiResponse, GetReleaseInfoApiArg>({
      query: (queryArg) => ({ url: `/api/onboarding/releases/${queryArg.releaseName}` }),
    }),
    operations: build.mutation<OperationsApiResponse, OperationsApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/operations`,
        method: 'POST',
        body: queryArg.operationsRequestModel,
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    getProduct: build.query<GetProductApiResponse, GetProductApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/products/${queryArg.productId}`,
      }),
    }),
    deleteProduct: build.mutation<DeleteProductApiResponse, DeleteProductApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/products/${queryArg.productId}`,
        method: 'DELETE',
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    updateProduct: build.mutation<UpdateProductApiResponse, UpdateProductApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/products/${queryArg.productId}`,
        method: 'PATCH',
        body: queryArg.productPatchModel,
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    createProduct: build.mutation<CreateProductApiResponse, CreateProductApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/products`,
        method: 'POST',
        body: queryArg.productPostModel,
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    getProjectEntityCounts: build.query<
      GetProjectEntityCountsApiResponse,
      GetProjectEntityCountsApiArg
    >({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/dashboard/entities` }),
    }),
    getProjectHealth: build.query<GetProjectHealthApiResponse, GetProjectHealthApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/dashboard/health` }),
    }),
    getProjectActivity: build.query<GetProjectActivityApiResponse, GetProjectActivityApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/dashboard/activity`,
        params: { days: queryArg.days },
      }),
    }),
    getProjectUsers: build.query<GetProjectUsersApiResponse, GetProjectUsersApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/dashboard/users` }),
    }),
    getProjectAnatomy: build.query<GetProjectAnatomyApiResponse, GetProjectAnatomyApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/anatomy` }),
    }),
    setProjectAnatomy: build.mutation<SetProjectAnatomyApiResponse, SetProjectAnatomyApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/anatomy`,
        method: 'POST',
        body: queryArg.anatomy,
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    listProjects: build.query<ListProjectsApiResponse, ListProjectsApiArg>({
      query: (queryArg) => ({
        url: `/api/projects`,
        params: {
          page: queryArg.page,
          length: queryArg.length,
          library: queryArg.library,
          active: queryArg.active,
          order: queryArg.order,
          desc: queryArg.desc,
          name: queryArg.name,
        },
      }),
    }),
    deployProject: build.mutation<DeployProjectApiResponse, DeployProjectApiArg>({
      query: (queryArg) => ({
        url: `/api/projects`,
        method: 'POST',
        body: queryArg.deployProjectRequestModel,
      }),
    }),
    getProject: build.query<GetProjectApiResponse, GetProjectApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}` }),
    }),
    createProject: build.mutation<CreateProjectApiResponse, CreateProjectApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}`,
        method: 'PUT',
        body: queryArg.projectPostModel,
      }),
    }),
    deleteProject: build.mutation<DeleteProjectApiResponse, DeleteProjectApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}`, method: 'DELETE' }),
    }),
    updateProject: build.mutation<UpdateProjectApiResponse, UpdateProjectApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}`,
        method: 'PATCH',
        body: queryArg.projectPatchModel,
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    getProjectStats: build.query<GetProjectStatsApiResponse, GetProjectStatsApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/stats` }),
    }),
    getProjectRootsOverrides: build.query<
      GetProjectRootsOverridesApiResponse,
      GetProjectRootsOverridesApiArg
    >({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/roots` }),
    }),
    setProjectRootsOverrides: build.mutation<
      SetProjectRootsOverridesApiResponse,
      SetProjectRootsOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/roots/${queryArg.siteId}`,
        method: 'PUT',
        body: queryArg.payload,
      }),
    }),
    getProjectSiteRoots: build.query<GetProjectSiteRootsApiResponse, GetProjectSiteRootsApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/siteRoots`,
        headers: { 'x-ayon-site-id': queryArg['x-ayon-site-id'] },
        params: { platform: queryArg.platform },
      }),
    }),
    query: build.mutation<QueryApiResponse, QueryApiArg>({
      query: (queryArg) => ({
        url: `/api/query`,
        method: 'POST',
        body: queryArg.queryRequestModel,
      }),
    }),
    representationContextFilter: build.mutation<
      RepresentationContextFilterApiResponse,
      RepresentationContextFilterApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/repreContextFilter`,
        method: 'POST',
        body: queryArg.lookupRequestModel,
      }),
    }),
    getRepresentation: build.query<GetRepresentationApiResponse, GetRepresentationApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/representations/${queryArg.representationId}`,
      }),
    }),
    deleteRepresentation: build.mutation<
      DeleteRepresentationApiResponse,
      DeleteRepresentationApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/representations/${queryArg.representationId}`,
        method: 'DELETE',
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    updateRepresentation: build.mutation<
      UpdateRepresentationApiResponse,
      UpdateRepresentationApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/representations/${queryArg.representationId}`,
        method: 'PATCH',
        body: queryArg.representationPatchModel,
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    createRepresentation: build.mutation<
      CreateRepresentationApiResponse,
      CreateRepresentationApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/representations`,
        method: 'POST',
        body: queryArg.representationPostModel,
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    resolveUris: build.mutation<ResolveUrisApiResponse, ResolveUrisApiArg>({
      query: (queryArg) => ({
        url: `/api/resolve`,
        method: 'POST',
        body: queryArg.resolveRequestModel,
        headers: { 'x-ayon-site-id': queryArg['x-ayon-site-id'] },
        params: { pathOnly: queryArg.pathOnly },
      }),
    }),
    getReviewablesForProduct: build.query<
      GetReviewablesForProductApiResponse,
      GetReviewablesForProductApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/products/${queryArg.productId}/reviewables`,
      }),
    }),
    getReviewablesForVersion: build.query<
      GetReviewablesForVersionApiResponse,
      GetReviewablesForVersionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}/reviewables`,
      }),
    }),
    uploadReviewable: build.mutation<UploadReviewableApiResponse, UploadReviewableApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}/reviewables`,
        method: 'POST',
        headers: {
          'content-type': queryArg['content-type'],
          'x-file-name': queryArg['x-file-name'],
          'x-sender': queryArg['x-sender'],
        },
        params: { label: queryArg.label },
      }),
    }),
    sortVersionReviewables: build.mutation<
      SortVersionReviewablesApiResponse,
      SortVersionReviewablesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}/reviewables`,
        method: 'PATCH',
        body: queryArg.sortReviewablesRequest,
      }),
    }),
    getReviewablesForTask: build.query<
      GetReviewablesForTaskApiResponse,
      GetReviewablesForTaskApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks/${queryArg.taskId}/reviewables`,
      }),
    }),
    getReviewablesForFolder: build.query<
      GetReviewablesForFolderApiResponse,
      GetReviewablesForFolderApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders/${queryArg.folderId}/reviewables`,
      }),
    }),
    updateReviewable: build.mutation<UpdateReviewableApiResponse, UpdateReviewableApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}/reviewables/${queryArg.activityId}`,
        method: 'PATCH',
        body: queryArg.updateReviewablesRequest,
      }),
    }),
    listServices: build.query<ListServicesApiResponse, ListServicesApiArg>({
      query: () => ({ url: `/api/services` }),
    }),
    spawnService: build.mutation<SpawnServiceApiResponse, SpawnServiceApiArg>({
      query: (queryArg) => ({
        url: `/api/services/${queryArg.name}`,
        method: 'PUT',
        body: queryArg.spawnServiceRequestModel,
      }),
    }),
    deleteService: build.mutation<DeleteServiceApiResponse, DeleteServiceApiArg>({
      query: (queryArg) => ({ url: `/api/services/${queryArg.name}`, method: 'DELETE' }),
    }),
    patchService: build.mutation<PatchServiceApiResponse, PatchServiceApiArg>({
      query: (queryArg) => ({
        url: `/api/services/${queryArg.serviceName}`,
        method: 'PATCH',
        body: queryArg.patchServiceRequestModel,
      }),
    }),
    listHosts: build.query<ListHostsApiResponse, ListHostsApiArg>({
      query: () => ({ url: `/api/hosts` }),
    }),
    hostHeartbeat: build.mutation<HostHeartbeatApiResponse, HostHeartbeatApiArg>({
      query: (queryArg) => ({
        url: `/api/hosts/heartbeat`,
        method: 'POST',
        body: queryArg.heartbeatRequestModel,
      }),
    }),
    getAllAddonsSettings: build.query<GetAllAddonsSettingsApiResponse, GetAllAddonsSettingsApiArg>({
      query: (queryArg) => ({
        url: `/api/settings/addons`,
        params: { variant: queryArg.variant, project: queryArg.project, site: queryArg.site },
      }),
    }),
    getAllSiteSettings: build.query<GetAllSiteSettingsApiResponse, GetAllSiteSettingsApiArg>({
      query: (queryArg) => ({
        url: `/api/settings/addons/siteSettings`,
        params: { variant: queryArg.variant, site: queryArg.site },
      }),
    }),
    getAllSettings: build.query<GetAllSettingsApiResponse, GetAllSettingsApiArg>({
      query: (queryArg) => ({
        url: `/api/settings`,
        params: {
          bundle_name: queryArg.bundleName,
          project_name: queryArg.projectName,
          variant: queryArg.variant,
          summary: queryArg.summary,
          site_id: queryArg.siteId,
        },
      }),
    }),
    getSites: build.query<GetSitesApiResponse, GetSitesApiArg>({
      query: (queryArg) => ({
        url: `/api/system/sites`,
        params: { platform: queryArg.platform, hostname: queryArg.hostname },
      }),
    }),
    getSiteInfo: build.query<GetSiteInfoApiResponse, GetSiteInfoApiArg>({
      query: () => ({ url: `/api/info` }),
    }),
    getProductionMetrics: build.query<GetProductionMetricsApiResponse, GetProductionMetricsApiArg>({
      query: (queryArg) => ({
        url: `/api/metrics`,
        params: { system: queryArg.system, saturated: queryArg.saturated },
      }),
    }),
    getSystemMetrics: build.query<GetSystemMetricsApiResponse, GetSystemMetricsApiArg>({
      query: () => ({ url: `/api/metrics/system` }),
    }),
    getListOfSecrets: build.query<GetListOfSecretsApiResponse, GetListOfSecretsApiArg>({
      query: () => ({ url: `/api/secrets` }),
    }),
    getSecret: build.query<GetSecretApiResponse, GetSecretApiArg>({
      query: (queryArg) => ({ url: `/api/secrets/${queryArg.secretName}` }),
    }),
    saveSecret: build.mutation<SaveSecretApiResponse, SaveSecretApiArg>({
      query: (queryArg) => ({
        url: `/api/secrets/${queryArg.secretName}`,
        method: 'PUT',
        body: queryArg.secret,
      }),
    }),
    deleteSecret: build.mutation<DeleteSecretApiResponse, DeleteSecretApiArg>({
      query: (queryArg) => ({ url: `/api/secrets/${queryArg.secretName}`, method: 'DELETE' }),
    }),
    requestServerRestart: build.mutation<
      RequestServerRestartApiResponse,
      RequestServerRestartApiArg
    >({
      query: () => ({ url: `/api/system/restart`, method: 'POST' }),
    }),
    getRestartRequired: build.query<GetRestartRequiredApiResponse, GetRestartRequiredApiArg>({
      query: () => ({ url: `/api/system/restartRequired` }),
    }),
    setRestartRequired: build.mutation<SetRestartRequiredApiResponse, SetRestartRequiredApiArg>({
      query: (queryArg) => ({
        url: `/api/system/restartRequired`,
        method: 'POST',
        body: queryArg.restartRequiredModel,
      }),
    }),
    getTask: build.query<GetTaskApiResponse, GetTaskApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks/${queryArg.taskId}`,
      }),
    }),
    deleteTask: build.mutation<DeleteTaskApiResponse, DeleteTaskApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks/${queryArg.taskId}`,
        method: 'DELETE',
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    updateTask: build.mutation<UpdateTaskApiResponse, UpdateTaskApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks/${queryArg.taskId}`,
        method: 'PATCH',
        body: queryArg.taskPatchModel,
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    createTask: build.mutation<CreateTaskApiResponse, CreateTaskApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks`,
        method: 'POST',
        body: queryArg.taskPostModel,
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    assignUsersToTask: build.mutation<AssignUsersToTaskApiResponse, AssignUsersToTaskApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks/${queryArg.taskId}/assign`,
        method: 'POST',
        body: queryArg.assignUsersRequestModel,
      }),
    }),
    getTeams: build.query<GetTeamsApiResponse, GetTeamsApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/teams`,
        params: { show_members: queryArg.showMembers },
      }),
    }),
    updateTeams: build.mutation<UpdateTeamsApiResponse, UpdateTeamsApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/teams`,
        method: 'PATCH',
        body: queryArg.payload,
      }),
    }),
    saveTeam: build.mutation<SaveTeamApiResponse, SaveTeamApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/teams/${queryArg.teamName}`,
        method: 'PUT',
        body: queryArg.teamPutModel,
      }),
    }),
    deleteTeam: build.mutation<DeleteTeamApiResponse, DeleteTeamApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/teams/${queryArg.teamName}`,
        method: 'DELETE',
      }),
    }),
    saveTeamMember: build.mutation<SaveTeamMemberApiResponse, SaveTeamMemberApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/teams/${queryArg.teamName}/members/${queryArg.memberName}`,
        method: 'PUT',
        body: queryArg.teamMemberModel,
      }),
    }),
    deleteTeamMember: build.mutation<DeleteTeamMemberApiResponse, DeleteTeamMemberApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/teams/${queryArg.teamName}/members/${queryArg.memberName}`,
        method: 'DELETE',
      }),
    }),
    createThumbnail: build.mutation<CreateThumbnailApiResponse, CreateThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/thumbnails`,
        method: 'POST',
        headers: { 'content-type': queryArg['content-type'] },
      }),
    }),
    getThumbnail: build.query<GetThumbnailApiResponse, GetThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/thumbnails/${queryArg.thumbnailId}`,
        params: { placeholder: queryArg.placeholder },
      }),
    }),
    updateThumbnail: build.mutation<UpdateThumbnailApiResponse, UpdateThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/thumbnails/${queryArg.thumbnailId}`,
        method: 'PUT',
        headers: { 'content-type': queryArg['content-type'] },
      }),
    }),
    getFolderThumbnail: build.query<GetFolderThumbnailApiResponse, GetFolderThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders/${queryArg.folderId}/thumbnail`,
        params: { placeholder: queryArg.placeholder },
      }),
    }),
    createFolderThumbnail: build.mutation<
      CreateFolderThumbnailApiResponse,
      CreateFolderThumbnailApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders/${queryArg.folderId}/thumbnail`,
        method: 'POST',
        headers: { 'content-type': queryArg['content-type'] },
      }),
    }),
    getVersionThumbnail: build.query<GetVersionThumbnailApiResponse, GetVersionThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}/thumbnail`,
        params: { placeholder: queryArg.placeholder },
      }),
    }),
    createVersionThumbnail: build.mutation<
      CreateVersionThumbnailApiResponse,
      CreateVersionThumbnailApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}/thumbnail`,
        method: 'POST',
        headers: { 'content-type': queryArg['content-type'] },
      }),
    }),
    getWorkfileThumbnail: build.query<GetWorkfileThumbnailApiResponse, GetWorkfileThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/workfiles/${queryArg.workfileId}/thumbnail`,
        params: { placeholder: queryArg.placeholder },
      }),
    }),
    createWorkfileThumbnail: build.mutation<
      CreateWorkfileThumbnailApiResponse,
      CreateWorkfileThumbnailApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/workfiles/${queryArg.workfileId}/thumbnail`,
        method: 'POST',
        headers: { 'content-type': queryArg['content-type'] },
      }),
    }),
    getTaskThumbnail: build.query<GetTaskThumbnailApiResponse, GetTaskThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks/${queryArg.taskId}/thumbnail`,
        params: { placeholder: queryArg.placeholder },
      }),
    }),
    createTaskThumbnail: build.mutation<CreateTaskThumbnailApiResponse, CreateTaskThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks/${queryArg.taskId}/thumbnail`,
        method: 'POST',
        headers: { 'content-type': queryArg['content-type'] },
      }),
    }),
    getProjectEntityUris: build.mutation<
      GetProjectEntityUrisApiResponse,
      GetProjectEntityUrisApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/uris`,
        method: 'POST',
        body: queryArg.getUrisRequest,
      }),
    }),
    getAvatar: build.query<GetAvatarApiResponse, GetAvatarApiArg>({
      query: (queryArg) => ({ url: `/api/users/${queryArg.userName}/avatar` }),
    }),
    uploadAvatar: build.mutation<UploadAvatarApiResponse, UploadAvatarApiArg>({
      query: (queryArg) => ({ url: `/api/users/${queryArg.userName}/avatar`, method: 'PUT' }),
    }),
    deleteAvatar: build.mutation<DeleteAvatarApiResponse, DeleteAvatarApiArg>({
      query: (queryArg) => ({ url: `/api/users/${queryArg.userName}/avatar`, method: 'DELETE' }),
    }),
    passwordResetRequest: build.mutation<
      PasswordResetRequestApiResponse,
      PasswordResetRequestApiArg
    >({
      query: (queryArg) => ({
        url: `/api/users/passwordResetRequest`,
        method: 'POST',
        body: queryArg.passwordResetRequestModel,
      }),
    }),
    passwordReset: build.mutation<PasswordResetApiResponse, PasswordResetApiArg>({
      query: (queryArg) => ({
        url: `/api/users/passwordReset`,
        method: 'POST',
        body: queryArg.passwordResetModel,
      }),
    }),
    getCurrentUser: build.query<GetCurrentUserApiResponse, GetCurrentUserApiArg>({
      query: () => ({ url: `/api/users/me` }),
    }),
    getUser: build.query<GetUserApiResponse, GetUserApiArg>({
      query: (queryArg) => ({ url: `/api/users/${queryArg.userName}` }),
    }),
    createUser: build.mutation<CreateUserApiResponse, CreateUserApiArg>({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.userName}`,
        method: 'PUT',
        body: queryArg.newUserModel,
      }),
    }),
    deleteUser: build.mutation<DeleteUserApiResponse, DeleteUserApiArg>({
      query: (queryArg) => ({ url: `/api/users/${queryArg.userName}`, method: 'DELETE' }),
    }),
    patchUser: build.mutation<PatchUserApiResponse, PatchUserApiArg>({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.userName}`,
        method: 'PATCH',
        body: queryArg.userPatchModel,
      }),
    }),
    changePassword: build.mutation<ChangePasswordApiResponse, ChangePasswordApiArg>({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.userName}/password`,
        method: 'PATCH',
        body: queryArg.changePasswordRequestModel,
      }),
    }),
    checkPassword: build.mutation<CheckPasswordApiResponse, CheckPasswordApiArg>({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.userName}/checkPassword`,
        method: 'POST',
        body: queryArg.checkPasswordRequestModel,
      }),
    }),
    changeUserName: build.mutation<ChangeUserNameApiResponse, ChangeUserNameApiArg>({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.userName}/rename`,
        method: 'PATCH',
        body: queryArg.changeUserNameRequestModel,
      }),
    }),
    getUserSessions: build.query<GetUserSessionsApiResponse, GetUserSessionsApiArg>({
      query: (queryArg) => ({ url: `/api/users/${queryArg.userName}/sessions` }),
    }),
    deleteUserSession: build.mutation<DeleteUserSessionApiResponse, DeleteUserSessionApiArg>({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.userName}/sessions/${queryArg.sessionId}`,
        method: 'DELETE',
      }),
    }),
    assignAccessGroups: build.mutation<AssignAccessGroupsApiResponse, AssignAccessGroupsApiArg>({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.userName}/accessGroups`,
        method: 'PATCH',
        body: queryArg.assignAccessGroupsRequestModel,
      }),
    }),
    setFrontendPreferences: build.mutation<
      SetFrontendPreferencesApiResponse,
      SetFrontendPreferencesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.userName}/frontendPreferences`,
        method: 'PATCH',
        body: queryArg.patchData,
      }),
    }),
    getVersion: build.query<GetVersionApiResponse, GetVersionApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}`,
      }),
    }),
    deleteVersion: build.mutation<DeleteVersionApiResponse, DeleteVersionApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}`,
        method: 'DELETE',
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    updateVersion: build.mutation<UpdateVersionApiResponse, UpdateVersionApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}`,
        method: 'PATCH',
        body: queryArg.versionPatchModel,
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    createVersion: build.mutation<CreateVersionApiResponse, CreateVersionApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions`,
        method: 'POST',
        body: queryArg.versionPostModel,
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    getWorkfile: build.query<GetWorkfileApiResponse, GetWorkfileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/workfiles/${queryArg.workfileId}`,
      }),
    }),
    deleteWorkfile: build.mutation<DeleteWorkfileApiResponse, DeleteWorkfileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/workfiles/${queryArg.workfileId}`,
        method: 'DELETE',
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    updateWorkfile: build.mutation<UpdateWorkfileApiResponse, UpdateWorkfileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/workfiles/${queryArg.workfileId}`,
        method: 'PATCH',
        body: queryArg.workfilePatchModel,
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    createWorkfile: build.mutation<CreateWorkfileApiResponse, CreateWorkfileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/workfiles`,
        method: 'POST',
        body: queryArg.workfilePostModel,
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as restApi }
export type GetAccessGroupSchemaApiResponse = /** status 200 Successful Response */ any
export type GetAccessGroupSchemaApiArg = void
export type GetAccessGroupsApiResponse = /** status 200 Successful Response */ object[]
export type GetAccessGroupsApiArg = {
  projectName: string
}
export type GetAccessGroupApiResponse = /** status 200 Successful Response */ Permissions
export type GetAccessGroupApiArg = {
  accessGroupName: string
  projectName: string
}
export type SaveAccessGroupApiResponse = /** status 204 Successful Response */ void
export type SaveAccessGroupApiArg = {
  accessGroupName: string
  projectName: string
  data: Permissions
}
export type DeleteAccessGroupApiResponse = /** status 204 Successful Response */ void
export type DeleteAccessGroupApiArg = {
  accessGroupName: string
  projectName: string
}
export type ListAvailableActionsForContextApiResponse =
  /** status 200 Successful Response */ AvailableActionsListModel
export type ListAvailableActionsForContextApiArg = {
  mode?: 'simple' | 'dynamic' | 'all'
  actionContext: ActionContext
}
export type ListAllActionsApiResponse = /** status 200 Successful Response */ BaseActionManifest[]
export type ListAllActionsApiArg = void
export type ExecuteActionApiResponse = /** status 200 Successful Response */ ExecuteResponseModel
export type ExecuteActionApiArg = {
  addonName: string
  addonVersion: string
  variant?: string
  identifier: string
  actionContext: ActionContext
}
export type TakeActionApiResponse = /** status 200 Successful Response */ TakeResponseModel
export type TakeActionApiArg = {
  token: string
}
export type PostProjectActivityApiResponse =
  /** status 201 Successful Response */ CreateActivityResponseModel
export type PostProjectActivityApiArg = {
  projectName: string
  entityType: string
  entityId: string
  'x-sender'?: string
  projectActivityPostModel: ProjectActivityPostModel
}
export type DeleteProjectActivityApiResponse = /** status 200 Successful Response */ any
export type DeleteProjectActivityApiArg = {
  activityId: string
  projectName: string
  'x-sender'?: string
}
export type PatchProjectActivityApiResponse = /** status 200 Successful Response */ any
export type PatchProjectActivityApiArg = {
  activityId: string
  projectName: string
  'x-sender'?: string
  activityPatchModel: ActivityPatchModel
}
export type SuggestEntityMentionApiResponse = /** status 200 Successful Response */ SuggestResponse
export type SuggestEntityMentionApiArg = {
  projectName: string
  suggestRequest: SuggestRequest
}
export type GetEntityWatchersApiResponse = /** status 200 Successful Response */ WatchersModel
export type GetEntityWatchersApiArg = {
  projectName: string
  entityType: string
  entityId: string
}
export type SetEntityWatchersApiResponse = /** status 201 Successful Response */ any
export type SetEntityWatchersApiArg = {
  projectName: string
  entityType: string
  entityId: string
  'x-sender'?: string
  watchersModel: WatchersModel
}
export type DeleteAddonApiResponse = /** status 200 Successful Response */ any
export type DeleteAddonApiArg = {
  addonName: string
  purge?: boolean
}
export type DeleteAddonVersionApiResponse = /** status 200 Successful Response */ any
export type DeleteAddonVersionApiArg = {
  addonName: string
  addonVersion: string
  purge?: boolean
}
export type GetInstalledAddonsListApiResponse =
  /** status 200 Successful Response */ AddonInstallListResponseModel
export type GetInstalledAddonsListApiArg = void
export type UploadAddonZipFileApiResponse =
  /** status 200 Successful Response */ InstallAddonResponseModel
export type UploadAddonZipFileApiArg = {
  url?: string
  addonName?: string
  addonVersion?: string
}
export type GetAddonProjectSettingsSchemaApiResponse = /** status 200 Successful Response */ object
export type GetAddonProjectSettingsSchemaApiArg = {
  addonName: string
  version: string
  projectName: string
  variant?: string
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
}
export type GetAddonProjectSettingsApiResponse = /** status 200 Successful Response */ object
export type GetAddonProjectSettingsApiArg = {
  addonName: string
  version: string
  projectName: string
  variant?: string
  as?: string
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
}
export type SetAddonProjectSettingsApiResponse = /** status 204 Successful Response */ void
export type SetAddonProjectSettingsApiArg = {
  addonName: string
  version: string
  projectName: string
  variant?: string
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
  payload: object
}
export type GetAddonProjectOverridesApiResponse = /** status 200 Successful Response */ any
export type GetAddonProjectOverridesApiArg = {
  addonName: string
  version: string
  projectName: string
  variant?: string
  as?: string
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
}
export type ModifyProjectOverridesApiResponse = /** status 204 Successful Response */ void
export type ModifyProjectOverridesApiArg = {
  addonName: string
  version: string
  projectName: string
  variant?: string
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
  modifyOverridesRequestModel: ModifyOverridesRequestModel
}
export type DeleteAddonProjectOverridesApiResponse = /** status 204 Successful Response */ void
export type DeleteAddonProjectOverridesApiArg = {
  addonName: string
  version: string
  projectName: string
  variant?: string
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
}
export type GetRawAddonProjectOverridesApiResponse = /** status 200 Successful Response */ object
export type GetRawAddonProjectOverridesApiArg = {
  addonName: string
  addonVersion: string
  projectName: string
  variant?: string
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
}
export type SetRawAddonProjectOverridesApiResponse = /** status 204 Successful Response */ void
export type SetRawAddonProjectOverridesApiArg = {
  addonName: string
  addonVersion: string
  projectName: string
  variant?: string
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
  payload: object
}
export type GetAddonSiteSettingsSchemaApiResponse = /** status 200 Successful Response */ object
export type GetAddonSiteSettingsSchemaApiArg = {
  addonName: string
  version: string
}
export type GetAddonSiteSettingsApiResponse = /** status 200 Successful Response */ object
export type GetAddonSiteSettingsApiArg = {
  addonName: string
  version: string
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
}
export type SetAddonSiteSettingsApiResponse = /** status 204 Successful Response */ void
export type SetAddonSiteSettingsApiArg = {
  addonName: string
  version: string
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
  payload: object
}
export type GetAddonSettingsSchemaApiResponse = /** status 200 Successful Response */ object
export type GetAddonSettingsSchemaApiArg = {
  addonName: string
  addonVersion: string
  variant?: string
}
export type GetAddonStudioSettingsApiResponse = /** status 200 Successful Response */ object
export type GetAddonStudioSettingsApiArg = {
  addonName: string
  addonVersion: string
  variant?: string
  as?: string
}
export type SetAddonStudioSettingsApiResponse = /** status 204 Successful Response */ void
export type SetAddonStudioSettingsApiArg = {
  addonName: string
  addonVersion: string
  variant?: string
  payload: object
}
export type GetAddonStudioOverridesApiResponse = /** status 200 Successful Response */ any
export type GetAddonStudioOverridesApiArg = {
  addonName: string
  addonVersion: string
  variant?: string
  as?: string
}
export type ModifyStudioOverridesApiResponse = /** status 204 Successful Response */ void
export type ModifyStudioOverridesApiArg = {
  addonName: string
  addonVersion: string
  variant?: string
  modifyOverridesRequestModel: ModifyOverridesRequestModel
}
export type DeleteAddonStudioOverridesApiResponse = /** status 204 Successful Response */ void
export type DeleteAddonStudioOverridesApiArg = {
  addonName: string
  addonVersion: string
  variant?: string
}
export type GetRawAddonStudioOverridesApiResponse = /** status 200 Successful Response */ object
export type GetRawAddonStudioOverridesApiArg = {
  addonName: string
  addonVersion: string
  variant?: string
}
export type SetRawAddonStudioOverridesApiResponse = /** status 204 Successful Response */ void
export type SetRawAddonStudioOverridesApiArg = {
  addonName: string
  addonVersion: string
  variant?: string
  payload: object
}
export type ListAddonsApiResponse = /** status 200 Successful Response */ AddonList
export type ListAddonsApiArg = {
  details?: boolean
}
export type ConfigureAddonsApiResponse = /** status 200 Successful Response */ any
export type ConfigureAddonsApiArg = {
  addonConfigRequest: AddonConfigRequest
}
export type GetAnatomySchemaApiResponse = /** status 200 Successful Response */ object
export type GetAnatomySchemaApiArg = void
export type GetAnatomyPresetsApiResponse =
  /** status 200 Successful Response */ AnatomyPresetListModel
export type GetAnatomyPresetsApiArg = void
export type GetAnatomyPresetApiResponse = /** status 200 Successful Response */ ProjectAnatomy
export type GetAnatomyPresetApiArg = {
  presetName: string
}
export type UpdateAnatomyPresetApiResponse = /** status 204 Successful Response */ void
export type UpdateAnatomyPresetApiArg = {
  presetName: string
  anatomy: ProjectAnatomy
}
export type DeleteAnatomyPresetApiResponse = /** status 204 Successful Response */ void
export type DeleteAnatomyPresetApiArg = {
  presetName: string
}
export type SetPrimaryPresetApiResponse = /** status 204 Successful Response */ void
export type SetPrimaryPresetApiArg = {
  presetName: string
}
export type UnsetPrimaryPresetApiResponse = /** status 204 Successful Response */ void
export type UnsetPrimaryPresetApiArg = {
  presetName: string
}
export type GetAttributeListApiResponse =
  /** status 200 Successful Response */ GetAttributeListModel
export type GetAttributeListApiArg = void
export type SetAttributeListApiResponse = /** status 204 Successful Response */ void
export type SetAttributeListApiArg = {
  setAttributeListModel: SetAttributeListModel
}
export type GetAttributeConfigApiResponse = /** status 200 Successful Response */ AttributeModel
export type GetAttributeConfigApiArg = {
  attributeName: string
}
export type SetAttributeConfigApiResponse = /** status 204 Successful Response */ void
export type SetAttributeConfigApiArg = {
  attributeName: string
  attributePutModel: AttributePutModel
}
export type DeleteAttributeApiResponse = /** status 204 Successful Response */ void
export type DeleteAttributeApiArg = {
  attributeName: string
}
export type LoginApiResponse = /** status 200 Successful Response */ LoginResponseModel
export type LoginApiArg = {
  loginRequestModel: LoginRequestModel
}
export type LogoutApiResponse = /** status 200 Successful Response */ LogoutResponseModel
export type LogoutApiArg = void
export type ListActiveSessionsApiResponse = /** status 200 Successful Response */ SessionModel[]
export type ListActiveSessionsApiArg = void
export type ListBundlesApiResponse = /** status 200 Successful Response */ ListBundleModel
export type ListBundlesApiArg = {
  /** Include archived bundles */
  archived?: boolean
}
export type CreateNewBundleApiResponse = /** status 201 Successful Response */ any
export type CreateNewBundleApiArg = {
  /** Force creation of bundle */
  force?: boolean
  'x-sender'?: string
  bundleModel: BundleModel
}
export type CheckBundleCompatibilityApiResponse =
  /** status 200 Successful Response */ CheckBundleResponseModel
export type CheckBundleCompatibilityApiArg = {
  bundleModel: BundleModel
}
export type BundleActionsApiResponse = /** status 201 Successful Response */ any
export type BundleActionsApiArg = {
  bundleName: string
  bundleActionModel: BundleActionModel
}
export type DeleteExistingBundleApiResponse = /** status 204 Successful Response */ void
export type DeleteExistingBundleApiArg = {
  bundleName: string
}
export type UpdateBundleApiResponse = /** status 204 Successful Response */ void
export type UpdateBundleApiArg = {
  bundleName: string
  /** Build dependency packages for selected platforms */
  build?: ('windows' | 'linux' | 'darwin')[]
  /** Force creation of bundle */
  force?: boolean
  'x-sender'?: string
  bundlePatchModel: BundlePatchModel
}
export type GetYnputCloudInfoApiResponse =
  /** status 200 Successful Response */ YnputConnectResponseModel
export type GetYnputCloudInfoApiArg = void
export type SetYnputCloudKeyApiResponse =
  /** status 200 Successful Response */ YnputConnectResponseModel
export type SetYnputCloudKeyApiArg = {
  ynputConnectRequestModel: YnputConnectRequestModel
}
export type DeleteYnputCloudKeyApiResponse = /** status 200 Successful Response */ any
export type DeleteYnputCloudKeyApiArg = void
export type ConnectToYnputCloudApiResponse = /** status 200 Successful Response */ any
export type ConnectToYnputCloudApiArg = {
  originUrl: string
}
export type ListDependencyPackagesApiResponse =
  /** status 200 Successful Response */ DependencyPackageList
export type ListDependencyPackagesApiArg = void
export type CreateDependencyPackageApiResponse =
  /** status 201 Successful Response */ InstallResponseModel
export type CreateDependencyPackageApiArg = {
  /** URL to the addon zip file */
  url?: string
  /** Deprecated. Use the force. */
  overwrite?: boolean
  /** Force install the package if it already exists */
  force?: boolean
  dependencyPackage: DependencyPackage
}
export type DownloadDependencyPackageApiResponse = /** status 200 Successful Response */ any
export type DownloadDependencyPackageApiArg = {
  filename: string
}
export type UploadDependencyPackageApiResponse = /** status 204 Successful Response */ void
export type UploadDependencyPackageApiArg = {
  filename: string
}
export type DeleteDependencyPackageApiResponse = /** status 204 Successful Response */ void
export type DeleteDependencyPackageApiArg = {
  filename: string
}
export type UpdateDependencyPackageApiResponse = /** status 204 Successful Response */ void
export type UpdateDependencyPackageApiArg = {
  filename: string
  sourcesPatchModel: SourcesPatchModel
}
export type ListInstallersApiResponse = /** status 200 Successful Response */ InstallerListModel
export type ListInstallersApiArg = {
  /** Version of the package */
  version?: string
  /** Platform of the package */
  platform?: 'windows' | 'linux' | 'darwin'
  variant?: 'production' | 'staging'
}
export type CreateInstallerApiResponse = /** status 201 Successful Response */ InstallResponseModel
export type CreateInstallerApiArg = {
  /** URL to the addon zip file */
  url?: string
  /** Deprecated. Use the force */
  overwrite?: boolean
  /** Overwrite existing installer */
  force?: boolean
  installer: Installer
}
export type DownloadInstallerFileApiResponse = /** status 200 Successful Response */ any
export type DownloadInstallerFileApiArg = {
  filename: string
}
export type UploadInstallerFileApiResponse = /** status 204 Successful Response */ void
export type UploadInstallerFileApiArg = {
  filename: string
}
export type DeleteInstallerFileApiResponse = /** status 204 Successful Response */ void
export type DeleteInstallerFileApiArg = {
  filename: string
}
export type PatchInstallerApiResponse = /** status 204 Successful Response */ void
export type PatchInstallerApiArg = {
  filename: string
  sourcesPatchModel: SourcesPatchModel
}
export type EnrollApiResponse = /** status 200 Successful Response */ EnrollResponseModel
export type EnrollApiArg = {
  enrollRequestModel: EnrollRequestModel
}
export type PostEventApiResponse = /** status 200 Successful Response */ DispatchEventResponseModel
export type PostEventApiArg = {
  dispatchEventRequestModel: DispatchEventRequestModel
}
export type GetEventApiResponse = /** status 200 Successful Response */ EventModel
export type GetEventApiArg = {
  eventId: string
}
export type UpdateExistingEventApiResponse = /** status 204 Successful Response */ void
export type UpdateExistingEventApiArg = {
  eventId: string
  updateEventRequestModel: UpdateEventRequestModel
}
export type UploadProjectFileApiResponse =
  /** status 201 Successful Response */ CreateFileResponseModel
export type UploadProjectFileApiArg = {
  projectName: string
  'x-file-id'?: string
  'x-file-name': string
  'x-activity-id'?: string
  'content-type': string
}
export type GetProjectFileApiResponse = /** status 200 Successful Response */ any
export type GetProjectFileApiArg = {
  fileId: string
  projectName: string
}
export type DeleteProjectFileApiResponse = /** status 200 Successful Response */ any
export type DeleteProjectFileApiArg = {
  fileId: string
  projectName: string
}
export type GetProjectFileHeadApiResponse = /** status 200 Successful Response */ any
export type GetProjectFileHeadApiArg = {
  fileId: string
  projectName: string
}
export type GetProjectFileThumbnailApiResponse = /** status 200 Successful Response */ any
export type GetProjectFileThumbnailApiArg = {
  fileId: string
  projectName: string
}
export type GetFolderApiResponse = /** status 200 Successful Response */ FolderModel
export type GetFolderApiArg = {
  projectName: string
  folderId: string
}
export type DeleteFolderApiResponse = /** status 204 Successful Response */ void
export type DeleteFolderApiArg = {
  projectName: string
  folderId: string
  /** Allow recursive deletion */
  force?: boolean
  'x-sender'?: string
}
export type UpdateFolderApiResponse = /** status 204 Successful Response */ void
export type UpdateFolderApiArg = {
  projectName: string
  folderId: string
  'x-sender'?: string
  folderPatchModel: FolderPatchModel
}
export type GetFolderListApiResponse = /** status 200 Successful Response */ FolderListModel
export type GetFolderListApiArg = {
  projectName: string
  attrib?: boolean
}
export type CreateFolderApiResponse = /** status 201 Successful Response */ EntityIdResponse
export type CreateFolderApiArg = {
  projectName: string
  'x-sender'?: string
  folderPostModel: FolderPostModel
}
export type GetFolderHierarchyApiResponse =
  /** status 200 Successful Response */ HierarchyResponseModel
export type GetFolderHierarchyApiArg = {
  projectName: string
  /** Full-text search query used to limit the result */
  search?: string
  /** Comma separated list of folder_types to show */
  types?: string
}
export type ManageInboxItemApiResponse = /** status 200 Successful Response */ any
export type ManageInboxItemApiArg = {
  manageInboxItemRequest: ManageInboxItemRequest
}
export type ListLinkTypesApiResponse = /** status 200 Successful Response */ LinkTypeListResponse
export type ListLinkTypesApiArg = {
  projectName: string
}
export type SaveLinkTypeApiResponse = /** status 204 Successful Response */ void
export type SaveLinkTypeApiArg = {
  projectName: string
  linkType: string
  createLinkTypeRequestModel: CreateLinkTypeRequestModel
}
export type DeleteLinkTypeApiResponse = /** status 204 Successful Response */ void
export type DeleteLinkTypeApiArg = {
  projectName: string
  linkType: string
}
export type CreateEntityLinkApiResponse = /** status 200 Successful Response */ EntityIdResponse
export type CreateEntityLinkApiArg = {
  projectName: string
  createLinkRequestModel: CreateLinkRequestModel
}
export type DeleteEntityLinkApiResponse = /** status 204 Successful Response */ void
export type DeleteEntityLinkApiArg = {
  projectName: string
  linkId: string
}
export type MarketAddonListApiResponse = /** status 200 Successful Response */ any
export type MarketAddonListApiArg = void
export type MarketAddonDetailApiResponse = /** status 200 Successful Response */ any
export type MarketAddonDetailApiArg = {
  addonName: string
}
export type MarketAddonVersionDetailApiResponse = /** status 200 Successful Response */ any
export type MarketAddonVersionDetailApiArg = {
  addonName: string
  addonVersion: string
}
export type CreateFirstAdminApiResponse = /** status 200 Successful Response */ LoginResponseModel
export type CreateFirstAdminApiArg = {
  initializeRequestModel: InitializeRequestModel
}
export type AbortOnboardingApiResponse = /** status 200 Successful Response */ any
export type AbortOnboardingApiArg = void
export type RestartOnboardingApiResponse = /** status 200 Successful Response */ any
export type RestartOnboardingApiArg = void
export type GetReleasesApiResponse = /** status 200 Successful Response */ ReleaseListModel
export type GetReleasesApiArg = void
export type GetReleaseInfoApiResponse = /** status 200 Successful Response */ ReleaseInfoModel
export type GetReleaseInfoApiArg = {
  releaseName: string
}
export type OperationsApiResponse = /** status 200 Successful Response */ OperationsResponseModel
export type OperationsApiArg = {
  projectName: string
  'x-sender'?: string
  operationsRequestModel: OperationsRequestModel
}
export type GetProductApiResponse = /** status 200 Successful Response */ ProductModel
export type GetProductApiArg = {
  projectName: string
  productId: string
}
export type DeleteProductApiResponse = /** status 204 Successful Response */ void
export type DeleteProductApiArg = {
  projectName: string
  productId: string
  'x-sender'?: string
}
export type UpdateProductApiResponse = /** status 204 Successful Response */ void
export type UpdateProductApiArg = {
  projectName: string
  productId: string
  'x-sender'?: string
  productPatchModel: ProductPatchModel
}
export type CreateProductApiResponse = /** status 201 Successful Response */ EntityIdResponse
export type CreateProductApiArg = {
  projectName: string
  'x-sender'?: string
  productPostModel: ProductPostModel
}
export type GetProjectEntityCountsApiResponse = /** status 200 Successful Response */ EntityCounts
export type GetProjectEntityCountsApiArg = {
  projectName: string
}
export type GetProjectHealthApiResponse = /** status 200 Successful Response */ Health
export type GetProjectHealthApiArg = {
  projectName: string
}
export type GetProjectActivityApiResponse =
  /** status 200 Successful Response */ ActivityResponseModel
export type GetProjectActivityApiArg = {
  projectName: string
  /** Number of days to retrieve activity for */
  days?: number
}
export type GetProjectUsersApiResponse = /** status 200 Successful Response */ UsersResponseModel
export type GetProjectUsersApiArg = {
  projectName: string
}
export type GetProjectAnatomyApiResponse = /** status 200 Successful Response */ ProjectAnatomy
export type GetProjectAnatomyApiArg = {
  projectName: string
}
export type SetProjectAnatomyApiResponse = /** status 204 Successful Response */ void
export type SetProjectAnatomyApiArg = {
  projectName: string
  'x-sender'?: string
  anatomy: ProjectAnatomy
}
export type ListProjectsApiResponse =
  /** status 200 Successful Response */ ListProjectsResponseModel
export type ListProjectsApiArg = {
  page?: number
  /** If not provided, the result will not be limited */
  length?: number
  /** If not provided, return projects regardless the flag */
  library?: boolean
  /** If not provided, return projects regardless the flag */
  active?: boolean
  order?: 'name' | 'createdAt' | 'updatedAt'
  desc?: boolean
  /** Limit the result to project with the matching name,
            or its part. % character may be used as a wildcard */
  name?: string
}
export type DeployProjectApiResponse = /** status 201 Successful Response */ any
export type DeployProjectApiArg = {
  deployProjectRequestModel: DeployProjectRequestModel
}
export type GetProjectApiResponse = /** status 200 Successful Response */ ProjectModel
export type GetProjectApiArg = {
  projectName: string
}
export type CreateProjectApiResponse = /** status 201 Successful Response */ any
export type CreateProjectApiArg = {
  projectName: string
  projectPostModel: ProjectPostModel
}
export type DeleteProjectApiResponse = /** status 204 Successful Response */ void
export type DeleteProjectApiArg = {
  projectName: string
}
export type UpdateProjectApiResponse = /** status 204 Successful Response */ void
export type UpdateProjectApiArg = {
  projectName: string
  'x-sender'?: string
  projectPatchModel: ProjectPatchModel
}
export type GetProjectStatsApiResponse = /** status 200 Successful Response */ any
export type GetProjectStatsApiArg = {
  projectName: string
}
export type GetProjectRootsOverridesApiResponse = /** status 200 Successful Response */ {
  [key: string]: {
    [key: string]: string
  }
}
export type GetProjectRootsOverridesApiArg = {
  projectName: string
}
export type SetProjectRootsOverridesApiResponse = /** status 200 Successful Response */ any
export type SetProjectRootsOverridesApiArg = {
  siteId: string
  projectName: string
  payload: {
    [key: string]: string
  }
}
export type GetProjectSiteRootsApiResponse = /** status 200 Successful Response */ {
  [key: string]: string
}
export type GetProjectSiteRootsApiArg = {
  projectName: string
  platform?: 'windows' | 'linux' | 'darwin'
  /** Site ID may be specified either as a query parameter (`site_id` or `site`) or in a header. */
  'x-ayon-site-id'?: string
}
export type QueryApiResponse = /** status 200 Successful Response */ object[]
export type QueryApiArg = {
  queryRequestModel: QueryRequestModel
}
export type RepresentationContextFilterApiResponse =
  /** status 200 Successful Response */ LookupResponseModel
export type RepresentationContextFilterApiArg = {
  projectName: string
  lookupRequestModel: LookupRequestModel
}
export type GetRepresentationApiResponse = /** status 200 Successful Response */ RepresentationModel
export type GetRepresentationApiArg = {
  projectName: string
  representationId: string
}
export type DeleteRepresentationApiResponse = /** status 204 Successful Response */ void
export type DeleteRepresentationApiArg = {
  projectName: string
  representationId: string
  'x-sender'?: string
}
export type UpdateRepresentationApiResponse = /** status 204 Successful Response */ void
export type UpdateRepresentationApiArg = {
  projectName: string
  representationId: string
  'x-sender'?: string
  representationPatchModel: RepresentationPatchModel
}
export type CreateRepresentationApiResponse = /** status 201 Successful Response */ EntityIdResponse
export type CreateRepresentationApiArg = {
  projectName: string
  'x-sender'?: string
  representationPostModel: RepresentationPostModel
}
export type ResolveUrisApiResponse = /** status 200 Successful Response */ ResolvedUriModel[]
export type ResolveUrisApiArg = {
  /** Return only file paths */
  pathOnly?: boolean
  /** Site ID may be specified either as a query parameter (`site_id` or `site`) or in a header. */
  'x-ayon-site-id'?: string
  resolveRequestModel: ResolveRequestModel
}
export type GetReviewablesForProductApiResponse =
  /** status 200 Successful Response */ VersionReviewablesModel[]
export type GetReviewablesForProductApiArg = {
  projectName: string
  productId: string
}
export type GetReviewablesForVersionApiResponse =
  /** status 200 Successful Response */ VersionReviewablesModel
export type GetReviewablesForVersionApiArg = {
  projectName: string
  versionId: string
}
export type UploadReviewableApiResponse = /** status 200 Successful Response */ ReviewableModel
export type UploadReviewableApiArg = {
  projectName: string
  versionId: string
  /** Label */
  label?: string
  'content-type': string
  'x-file-name': string
  'x-sender'?: string
}
export type SortVersionReviewablesApiResponse = /** status 200 Successful Response */ any
export type SortVersionReviewablesApiArg = {
  projectName: string
  versionId: string
  sortReviewablesRequest: SortReviewablesRequest
}
export type GetReviewablesForTaskApiResponse =
  /** status 200 Successful Response */ VersionReviewablesModel[]
export type GetReviewablesForTaskApiArg = {
  projectName: string
  taskId: string
}
export type GetReviewablesForFolderApiResponse =
  /** status 200 Successful Response */ VersionReviewablesModel[]
export type GetReviewablesForFolderApiArg = {
  projectName: string
  folderId: string
}
export type UpdateReviewableApiResponse = /** status 200 Successful Response */ any
export type UpdateReviewableApiArg = {
  projectName: string
  versionId: string
  activityId: string
  updateReviewablesRequest: UpdateReviewablesRequest
}
export type ListServicesApiResponse = /** status 200 Successful Response */ ServiceListModel
export type ListServicesApiArg = void
export type SpawnServiceApiResponse = /** status 204 Successful Response */ void
export type SpawnServiceApiArg = {
  name: string
  spawnServiceRequestModel: SpawnServiceRequestModel
}
export type DeleteServiceApiResponse = /** status 204 Successful Response */ void
export type DeleteServiceApiArg = {
  name: string
}
export type PatchServiceApiResponse = /** status 204 Successful Response */ void
export type PatchServiceApiArg = {
  serviceName: string
  patchServiceRequestModel: PatchServiceRequestModel
}
export type ListHostsApiResponse = /** status 200 Successful Response */ HostListResponseModel
export type ListHostsApiArg = void
export type HostHeartbeatApiResponse = /** status 200 Successful Response */ HeartbeatResponseModel
export type HostHeartbeatApiArg = {
  heartbeatRequestModel: HeartbeatRequestModel
}
export type GetAllAddonsSettingsApiResponse =
  /** status 200 Successful Response */ AddonSettingsResponse
export type GetAllAddonsSettingsApiArg = {
  variant?: 'production' | 'staging'
  project?: string
  site?: string
}
export type GetAllSiteSettingsApiResponse =
  /** status 200 Successful Response */ AddonSettingsResponse
export type GetAllSiteSettingsApiArg = {
  variant?: 'production' | 'staging'
  site?: string
}
export type GetAllSettingsApiResponse =
  /** status 200 Successful Response */ AllSettingsResponseModel
export type GetAllSettingsApiArg = {
  /** Production if not set */
  bundleName?: string
  /** Studio settings if not set */
  projectName?: string
  variant?: string
  /** Summary mode */
  summary?: boolean
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
}
export type GetSitesApiResponse = /** status 200 Successful Response */ SiteInfo[]
export type GetSitesApiArg = {
  platform?: 'windows' | 'linux' | 'darwin'
  hostname?: string
}
export type GetSiteInfoApiResponse = /** status 200 Successful Response */ InfoResponseModel
export type GetSiteInfoApiArg = void
export type GetProductionMetricsApiResponse = /** status 200 Successful Response */ Metrics
export type GetProductionMetricsApiArg = {
  /** Collect system metrics */
  system?: boolean
  /** Collect saturated (more granular) metrics */
  saturated?: boolean
}
export type GetSystemMetricsApiResponse = /** status 200 Successful Response */ any
export type GetSystemMetricsApiArg = void
export type GetListOfSecretsApiResponse = /** status 200 Successful Response */ Secret[]
export type GetListOfSecretsApiArg = void
export type GetSecretApiResponse = /** status 200 Successful Response */ Secret
export type GetSecretApiArg = {
  secretName: string
}
export type SaveSecretApiResponse = /** status 204 Successful Response */ void
export type SaveSecretApiArg = {
  secretName: string
  secret: Secret
}
export type DeleteSecretApiResponse = /** status 204 Successful Response */ void
export type DeleteSecretApiArg = {
  secretName: string
}
export type RequestServerRestartApiResponse = /** status 200 Successful Response */ void
export type RequestServerRestartApiArg = void
export type GetRestartRequiredApiResponse =
  /** status 200 Successful Response */ RestartRequiredModel
export type GetRestartRequiredApiArg = void
export type SetRestartRequiredApiResponse = /** status 200 Successful Response */ any
export type SetRestartRequiredApiArg = {
  restartRequiredModel: RestartRequiredModel
}
export type GetTaskApiResponse = /** status 200 Successful Response */ TaskModel
export type GetTaskApiArg = {
  projectName: string
  taskId: string
}
export type DeleteTaskApiResponse = /** status 204 Successful Response */ void
export type DeleteTaskApiArg = {
  projectName: string
  taskId: string
  'x-sender'?: string
}
export type UpdateTaskApiResponse = /** status 204 Successful Response */ void
export type UpdateTaskApiArg = {
  projectName: string
  taskId: string
  'x-sender'?: string
  taskPatchModel: TaskPatchModel
}
export type CreateTaskApiResponse = /** status 201 Successful Response */ EntityIdResponse
export type CreateTaskApiArg = {
  projectName: string
  'x-sender'?: string
  taskPostModel: TaskPostModel
}
export type AssignUsersToTaskApiResponse = /** status 204 Successful Response */ void
export type AssignUsersToTaskApiArg = {
  projectName: string
  taskId: string
  assignUsersRequestModel: AssignUsersRequestModel
}
export type GetTeamsApiResponse = /** status 200 Successful Response */ TeamListItemModel[]
export type GetTeamsApiArg = {
  projectName: string
  showMembers?: boolean
}
export type UpdateTeamsApiResponse = /** status 204 Successful Response */ void
export type UpdateTeamsApiArg = {
  projectName: string
  payload: TeamModel[]
}
export type SaveTeamApiResponse = /** status 204 Successful Response */ void
export type SaveTeamApiArg = {
  teamName: string
  projectName: string
  teamPutModel: TeamPutModel
}
export type DeleteTeamApiResponse = /** status 204 Successful Response */ void
export type DeleteTeamApiArg = {
  teamName: string
  projectName: string
}
export type SaveTeamMemberApiResponse = /** status 204 Successful Response */ void
export type SaveTeamMemberApiArg = {
  teamName: string
  memberName: string
  projectName: string
  teamMemberModel: TeamMemberModel
}
export type DeleteTeamMemberApiResponse = /** status 204 Successful Response */ void
export type DeleteTeamMemberApiArg = {
  teamName: string
  memberName: string
  projectName: string
}
export type CreateThumbnailApiResponse =
  /** status 200 Successful Response */ CreateThumbnailResponseModel
export type CreateThumbnailApiArg = {
  projectName: string
  'content-type'?: string
}
export type GetThumbnailApiResponse = /** status 200 Successful Response */ void
export type GetThumbnailApiArg = {
  projectName: string
  thumbnailId: string
  placeholder?: 'empty' | 'none'
}
export type UpdateThumbnailApiResponse = /** status 204 Successful Response */ void
export type UpdateThumbnailApiArg = {
  projectName: string
  thumbnailId: string
  'content-type'?: string
}
export type GetFolderThumbnailApiResponse = /** status 200 Successful Response */ any
export type GetFolderThumbnailApiArg = {
  projectName: string
  folderId: string
  placeholder?: 'empty' | 'none'
}
export type CreateFolderThumbnailApiResponse =
  /** status 201 Successful Response */ CreateThumbnailResponseModel
export type CreateFolderThumbnailApiArg = {
  projectName: string
  folderId: string
  'content-type'?: string
}
export type GetVersionThumbnailApiResponse = /** status 200 Successful Response */ any
export type GetVersionThumbnailApiArg = {
  projectName: string
  versionId: string
  placeholder?: 'empty' | 'none'
}
export type CreateVersionThumbnailApiResponse =
  /** status 201 Successful Response */ CreateThumbnailResponseModel
export type CreateVersionThumbnailApiArg = {
  projectName: string
  versionId: string
  'content-type'?: string
}
export type GetWorkfileThumbnailApiResponse = /** status 200 Successful Response */ any
export type GetWorkfileThumbnailApiArg = {
  projectName: string
  workfileId: string
  placeholder?: 'empty' | 'none'
}
export type CreateWorkfileThumbnailApiResponse =
  /** status 201 Successful Response */ CreateThumbnailResponseModel
export type CreateWorkfileThumbnailApiArg = {
  projectName: string
  workfileId: string
  'content-type'?: string
}
export type GetTaskThumbnailApiResponse = /** status 200 Successful Response */ any
export type GetTaskThumbnailApiArg = {
  projectName: string
  taskId: string
  placeholder?: 'empty' | 'none'
}
export type CreateTaskThumbnailApiResponse =
  /** status 201 Successful Response */ CreateThumbnailResponseModel
export type CreateTaskThumbnailApiArg = {
  projectName: string
  taskId: string
  'content-type'?: string
}
export type GetProjectEntityUrisApiResponse = /** status 200 Successful Response */ GetUrisResponse
export type GetProjectEntityUrisApiArg = {
  projectName: string
  getUrisRequest: GetUrisRequest
}
export type GetAvatarApiResponse = /** status 200 Successful Response */ any
export type GetAvatarApiArg = {
  userName: string
}
export type UploadAvatarApiResponse = /** status 200 Successful Response */ any
export type UploadAvatarApiArg = {
  userName: string
}
export type DeleteAvatarApiResponse = /** status 200 Successful Response */ any
export type DeleteAvatarApiArg = {
  userName: string
}
export type PasswordResetRequestApiResponse = /** status 200 Successful Response */ any
export type PasswordResetRequestApiArg = {
  passwordResetRequestModel: PasswordResetRequestModel
}
export type PasswordResetApiResponse = /** status 200 Successful Response */ LoginResponseModel
export type PasswordResetApiArg = {
  passwordResetModel: PasswordResetModel
}
export type GetCurrentUserApiResponse = /** status 200 Successful Response */ UserModel
export type GetCurrentUserApiArg = void
export type GetUserApiResponse = /** status 200 Successful Response */
  | UserModel
  | {
      [key: string]: string
    }
export type GetUserApiArg = {
  userName: string
}
export type CreateUserApiResponse = /** status 200 Successful Response */ any
export type CreateUserApiArg = {
  userName: string
  newUserModel: NewUserModel
}
export type DeleteUserApiResponse = /** status 200 Successful Response */ any
export type DeleteUserApiArg = {
  userName: string
}
export type PatchUserApiResponse = /** status 200 Successful Response */ any
export type PatchUserApiArg = {
  userName: string
  userPatchModel: UserPatchModel
}
export type ChangePasswordApiResponse = /** status 200 Successful Response */ any
export type ChangePasswordApiArg = {
  userName: string
  changePasswordRequestModel: ChangePasswordRequestModel
}
export type CheckPasswordApiResponse = /** status 200 Successful Response */ any
export type CheckPasswordApiArg = {
  userName: string
  checkPasswordRequestModel: CheckPasswordRequestModel
}
export type ChangeUserNameApiResponse = /** status 200 Successful Response */ any
export type ChangeUserNameApiArg = {
  userName: string
  changeUserNameRequestModel: ChangeUserNameRequestModel
}
export type GetUserSessionsApiResponse =
  /** status 200 Successful Response */ UserSessionsResponseModel
export type GetUserSessionsApiArg = {
  userName: string
}
export type DeleteUserSessionApiResponse = /** status 200 Successful Response */ any
export type DeleteUserSessionApiArg = {
  sessionId: string
  userName: string
}
export type AssignAccessGroupsApiResponse = /** status 200 Successful Response */ any
export type AssignAccessGroupsApiArg = {
  userName: string
  assignAccessGroupsRequestModel: AssignAccessGroupsRequestModel
}
export type SetFrontendPreferencesApiResponse = /** status 200 Successful Response */ any
export type SetFrontendPreferencesApiArg = {
  userName: string
  patchData: object
}
export type GetVersionApiResponse = /** status 200 Successful Response */ VersionModel
export type GetVersionApiArg = {
  projectName: string
  versionId: string
}
export type DeleteVersionApiResponse = /** status 204 Successful Response */ void
export type DeleteVersionApiArg = {
  projectName: string
  versionId: string
  'x-sender'?: string
}
export type UpdateVersionApiResponse = /** status 204 Successful Response */ void
export type UpdateVersionApiArg = {
  projectName: string
  versionId: string
  'x-sender'?: string
  versionPatchModel: VersionPatchModel
}
export type CreateVersionApiResponse = /** status 201 Successful Response */ EntityIdResponse
export type CreateVersionApiArg = {
  projectName: string
  'x-sender'?: string
  versionPostModel: VersionPostModel
}
export type GetWorkfileApiResponse = /** status 200 Successful Response */ WorkfileModel
export type GetWorkfileApiArg = {
  projectName: string
  workfileId: string
}
export type DeleteWorkfileApiResponse = /** status 204 Successful Response */ void
export type DeleteWorkfileApiArg = {
  projectName: string
  workfileId: string
  'x-sender'?: string
}
export type UpdateWorkfileApiResponse = /** status 204 Successful Response */ void
export type UpdateWorkfileApiArg = {
  projectName: string
  workfileId: string
  'x-sender'?: string
  workfilePatchModel: WorkfilePatchModel
}
export type CreateWorkfileApiResponse = /** status 201 Successful Response */ EntityIdResponse
export type CreateWorkfileApiArg = {
  projectName: string
  'x-sender'?: string
  workfilePostModel: WorkfilePostModel
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type FolderAccess = {
  access_type?: string
  /** The path of the folder to allow access to. Required for access_type 'hierarchy and 'children' */
  path?: string
}
export type FolderAccessList = {
  enabled?: boolean
  access_list?: FolderAccess[]
}
export type AttributeAccessList = {
  enabled?: boolean
  attributes?: string[]
}
export type EndpointsAccessList = {
  enabled?: boolean
  endpoints?: string[]
}
export type Permissions = {
  /** Whitelist folders a user can create */
  create?: FolderAccessList
  /** Whitelist folders a user can read */
  read?: FolderAccessList
  /** Whitelist folders a user can update */
  update?: FolderAccessList
  /** Whitelist folders a user can publish to */
  publish?: FolderAccessList
  /** Whitelist folders a user can delete */
  delete?: FolderAccessList
  /** Whitelist attributes a user can read */
  attrib_read?: AttributeAccessList
  /** Whitelist attributes a user can write */
  attrib_write?: AttributeAccessList
  /** Whitelist REST endpoints a user can access */
  endpoints?: EndpointsAccessList
}
export type IconModel = {
  type?: 'material-symbols' | 'url'
  /** The name of the icon (for material-symbols) */
  name?: string
  /** The color of the icon (for material-symbols) */
  color?: string
  /** The URL of the icon (for url) */
  url?: string
}
export type BaseActionManifest = {
  /** The identifier of the action */
  identifier: string
  /** Human-friendly name of the action */
  label: string
  /** Action category */
  category?: string
  /** The order of the action */
  order?: number
  /** Path to the action icon */
  icon?: IconModel
  featured?: boolean
  /** The name of the addon providing the action */
  addonName?: string
  /** The version of the addon providing the action */
  addonVersion?: string
  /** The settings variant of the addon */
  variant?: string
}
export type AvailableActionsListModel = {
  /** The list of available actions */
  actions?: BaseActionManifest[]
}
export type ActionContext = {
  /** The name of the project */
  projectName: string
  /** The type of the entity */
  entityType: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  /** List of subtypes present in the entity list */
  entitySubtypes?: string[]
  /** The IDs of the entities */
  entityIds: string[]
}
export type ExecuteResponseModel = {
  /** The type of response */
  type: 'launcher' | 'server'
  /** Whether the action was successful */
  success?: boolean
  /** The message to display */
  message?: string
  /** The uri to call from the browser */
  uri?: string
}
export type TakeResponseModel = {
  eventId: string
  actionIdentifier: string
  args?: string[]
  context: ActionContext
  addonName: string
  addonVersion: string
  variant: string
  /** The user who initiated the action */
  userName: string
}
export type CreateActivityResponseModel = {
  id: string
}
export type ProjectActivityPostModel = {
  /** Explicitly set the ID of the activity */
  id?: string
  activityType:
    | 'comment'
    | 'watch'
    | 'reviewable'
    | 'status.change'
    | 'assignee.add'
    | 'assignee.remove'
    | 'version.publish'
  body?: string
  files?: string[]
  timestamp?: string
  /** Additional data */
  data?: object
}
export type ActivityPatchModel = {
  body: string
  files?: string[]
}
export type UserSuggestionItem = {
  /** The date and time when the suggested entity was created */
  createdAt?: string
  /** The relevance score of the suggestion */
  relevance?: number
  name: string
  fullName?: string
}
export type FolderSuggestionItem = {
  /** The date and time when the suggested entity was created */
  createdAt?: string
  /** The relevance score of the suggestion */
  relevance?: number
  id: string
  folderType: string
  name: string
  label?: string
  thumbnailId?: string
}
export type TaskSuggestionItem = {
  /** The date and time when the suggested entity was created */
  createdAt?: string
  /** The relevance score of the suggestion */
  relevance?: number
  id: string
  taskType: string
  name: string
  label?: string
  thumbnailId?: string
  parent?: FolderSuggestionItem
}
export type ProductSuggestionItem = {
  /** The date and time when the suggested entity was created */
  createdAt?: string
  /** The relevance score of the suggestion */
  relevance?: number
  id: string
  name: string
  productType: string
  parent?: FolderSuggestionItem
}
export type VersionSuggestionItem = {
  /** The date and time when the suggested entity was created */
  createdAt?: string
  /** The relevance score of the suggestion */
  relevance?: number
  id: string
  version: number
  parent?: ProductSuggestionItem
  name?: string
}
export type SuggestResponse = {
  users?: UserSuggestionItem[]
  tasks?: TaskSuggestionItem[]
  versions?: VersionSuggestionItem[]
}
export type SuggestRequest = {
  entityType: 'folder' | 'task' | 'version'
  entityId: string
}
export type WatchersModel = {
  watchers: string[]
}
export type ErrorResponse = {
  code: number
  detail: string
}
export type AddonInstallListItemModel = {
  id: string
  topic: 'addon.install' | 'addon.install_from_url'
  description: string
  addonName?: string
  addonVersion?: string
  user?: string
  status: string
  createdAt: string
  updatedAt?: string
}
export type AddonInstallListResponseModel = {
  items: AddonInstallListItemModel[]
  restartRequired: boolean
}
export type InstallAddonResponseModel = {
  eventId: string
}
export type ModifyOverridesRequestModel = {
  action: 'delete' | 'pin'
  path: string[]
}
export type PathDefinition = {
  windows?: string
  linux?: string
  darwin?: string
}
export type FilesystemSourceInfo = {
  type?: 'filesystem'
  path?: PathDefinition
}
export type ServerSourceInfo = {
  type?: 'server'
  filename?: string
  path?: string
}
export type HttpSourceInfo = {
  type?: 'http'
  url: string
  filename?: string
  headers?: {
    [key: string]: string
  }
}
export type VersionInfo = {
  hasSettings?: boolean
  hasSiteSettings?: boolean
  frontendScopes?: object
  clientPyproject?: object
  clientSourceInfo?: (FilesystemSourceInfo | ServerSourceInfo | HttpSourceInfo)[]
  services?: object
  isBroken?: boolean
  reason?: {
    [key: string]: string
  }
}
export type AddonListItem = {
  /** Machine friendly name of the addon */
  name: string
  /** Human friendly title of the addon */
  title: string
  /** List of available versions */
  versions: {
    [key: string]: VersionInfo
  }
  /** Addon description */
  description: string
  /** Production version of the addon */
  productionVersion?: string
  /** Staging version of the addon */
  stagingVersion?: string
  /** Type of the addon */
  addonType: 'server' | 'pipeline'
  /** Is the addon a system addon? */
  system?: boolean
}
export type AddonList = {
  /** List of available addons */
  addons: AddonListItem[]
}
export type VariantCopyRequest = {
  /** Addon name */
  addonName: string
  /** Source variant */
  copyFrom: 'production' | 'staging'
  /** Destination variant */
  copyTo: 'production' | 'staging'
}
export type AddonConfigRequest = {
  copyVariant?: VariantCopyRequest
}
export type AnatomyPresetListItem = {
  name: string
  primary: boolean
  version: string
}
export type AnatomyPresetListModel = {
  /** Anatomy model version currently used in Ayon */
  version: string
  presets?: AnatomyPresetListItem[]
}
export type Root = {
  name: string
  windows?: string
  linux?: string
  darwin?: string
}
export type WorkTemplate = {
  name: string
  directory: string
  file: string
}
export type PublishTemplate = {
  name: string
  directory: string
  file: string
}
export type HeroTemplate = {
  name: string
  directory: string
  file: string
}
export type DeliveryTemplate = {
  name: string
  directory: string
  file: string
}
export type StagingDirectory = {
  name: string
  directory?: string
}
export type CustomTemplate = {
  name: string
  value?: string
}
export type Templates = {
  version_padding?: number
  version?: string
  frame_padding?: number
  frame?: string
  work?: WorkTemplate[]
  publish?: PublishTemplate[]
  hero?: HeroTemplate[]
  delivery?: DeliveryTemplate[]
  staging?: StagingDirectory[]
  others?: CustomTemplate[]
}
export type ProjectAttribModel = {
  /** Frame rate */
  fps?: number
  /** Horizontal resolution */
  resolutionWidth?: number
  /** Vertical resolution */
  resolutionHeight?: number
  pixelAspect?: number
  clipIn?: number
  clipOut?: number
  frameStart?: number
  frameEnd?: number
  handleStart?: number
  handleEnd?: number
  /** Date and time when the project or task or asset was started */
  startDate?: string
  /** Deadline date and time */
  endDate?: string
  /** Textual description of the entity */
  description?: string
  applications?: string[]
  tools?: string[]
  ftrackId?: string
  ftrackPath?: string
  /** The Shotgrid ID of this entity. */
  shotgridId?: string
  /** The Shotgrid Type of this entity. */
  shotgridType?: string
  /** Push changes done to this project to Shotgird. Requires the transmitter service. */
  shotgridPush?: boolean
  sokoId?: string
  sokoPath?: string
}
export type FolderType = {
  name: string
  shortName?: string
  icon?: string
  original_name?: string
}
export type TaskType = {
  name: string
  shortName?: string
  icon?: string
  original_name?: string
}
export type LinkType = {
  link_type: string
  input_type: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  output_type: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  color?: string
  style?: 'solid' | 'dashed'
}
export type Status = {
  name: string
  shortName?: string
  state?: 'not_started' | 'in_progress' | 'done' | 'blocked'
  icon?: string
  color?: string
  original_name?: string
}
export type Tag = {
  name: string
  color?: string
  original_name?: string
}
export type ProjectAnatomy = {
  /** Setup root paths for the project */
  roots?: Root[]
  /** Path templates configuration */
  templates?: Templates
  /** Attributes configuration */
  attributes?: ProjectAttribModel
  /** Folder types configuration */
  folder_types?: FolderType[]
  /** Task types configuration */
  task_types?: TaskType[]
  /** Link types configuration */
  link_types?: LinkType[]
  /** Statuses configuration */
  statuses?: Status[]
  /** Tags configuration */
  tags?: Tag[]
}
export type AttributeEnumItem = {
  value: string | number | number | boolean
  label: string
}
export type AttributeData = {
  /** Type of attribute value */
  type:
    | 'string'
    | 'integer'
    | 'float'
    | 'boolean'
    | 'datetime'
    | 'list_of_strings'
    | 'list_of_integers'
    | 'list_of_any'
    | 'list_of_submodels'
    | 'dict'
  /** Nice, human readable title of the attribute */
  title?: string
  description?: string
  /** Example value of the field. */
  example?: any
  /** Default value for the attribute. Do not set for list types. */
  default?: any
  gt?: number | number
  ge?: number | number
  lt?: number | number
  le?: number | number
  minLength?: number
  maxLength?: number
  /** Minimum number of items in list type. */
  minItems?: number
  /** Only for list types. Maximum number of items in the list. */
  maxItems?: number
  /** Only for string types. The value must match this regex. */
  regex?: string
  /** List of enum items used for displaying select/multiselect widgets */
  enum?: AttributeEnumItem[]
  /** Inherit the attribute value from the parent entity. */
  inherit?: boolean
}
export type AttributeModel = {
  name: string
  /** Default order */
  position: number
  /** List of entity types the attribute is available on */
  scope?: (
    | ('folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile')
    | ('project' | 'user')
  )[]
  /** Is attribute builtin. Built-in attributes cannot be removed. */
  builtin?: boolean
  data: AttributeData
}
export type GetAttributeListModel = {
  attributes?: AttributeModel[]
}
export type SetAttributeListModel = {
  attributes?: AttributeModel[]
  /** Delete custom attributes not includedin the payload from the database. */
  deleteMissing?: boolean
}
export type AttributePutModel = {
  /** Default order */
  position: number
  /** List of entity types the attribute is available on */
  scope?: (
    | ('folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile')
    | ('project' | 'user')
  )[]
  /** Is attribute builtin. Built-in attributes cannot be removed. */
  builtin?: boolean
  data: AttributeData
}
export type UserAttribModel = {
  fullName?: string
  email?: string
  avatarUrl?: string
  developerMode?: boolean
}
export type UserModel = {
  /** Name is an unique id of the {entity_name} */
  name: string
  attrib?: UserAttribModel
  data?: object
  /** Whether the user is active */
  active?: boolean
  ownAttrib?: string[]
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type LoginResponseModel = {
  detail?: string
  error?: string
  token?: string
  user?: UserModel
}
export type LoginRequestModel = {
  /** Username */
  name: string
  /** Password */
  password: string
}
export type LogoutResponseModel = {
  /** Text description, which may be displayed to the user */
  detail?: string
}
export type LocationInfo = {
  country?: string
  subdivision?: string
  city?: string
}
export type AgentInfo = {
  platform?: string
  client?: string
  device?: string
}
export type ClientInfo = {
  ip: string
  languages?: string[]
  location?: LocationInfo
  agent?: AgentInfo
  site_id?: string
}
export type SessionModel = {
  user: UserModel
  token: string
  created?: number
  lastUsed?: number
  isService?: boolean
  clientInfo?: ClientInfo
}
export type AddonDevelopmentItem = {
  /** Enable/disable addon development */
  enabled?: boolean
  /** Path to addon directory */
  path?: string
}
export type BundleModel = {
  /** Name of the bundle */
  name: string
  createdAt?: string
  addons?: {
    [key: string]: string
  }
  installerVersion?: string
  /** mapping of platform:dependency_package_filename */
  dependencyPackages?: {
    [key: string]: string
  }
  addonDevelopment?: {
    [key: string]: AddonDevelopmentItem
  }
  isProduction?: boolean
  isStaging?: boolean
  isArchived?: boolean
  isDev?: boolean
  activeUser?: string
}
export type ListBundleModel = {
  bundles?: BundleModel[]
  productionBundle?: string
  stagingBundle?: string
  devBundles?: string[]
}
export type BundleIssueModel = {
  severity: 'error' | 'warning'
  addon?: string
  message: string
  requiredAddon?: string
}
export type CheckBundleResponseModel = {
  success?: boolean
  issues?: BundleIssueModel[]
}
export type BundleActionModel = {
  action: 'promote'
}
export type BundlePatchModel = {
  addons?: {
    [key: string]: string
  }
  installerVersion?: string
  /** mapping of platform:dependency_package_filename */
  dependencyPackages?: {
    [key: string]: string
  }
  isProduction?: boolean
  isStaging?: boolean
  isArchived?: boolean
  isDev?: boolean
  activeUser?: string
  addonDevelopment?: {
    [key: string]: AddonDevelopmentItem
  }
}
export type YnputConnectSubscriptionModel = {
  /** Name of the subscription */
  name: string
  /** Type of the subscription */
  productType: string
}
export type YnputConnectResponseModel = {
  /** ID of the instance */
  instanceId: string
  /** Name of the instance */
  instanceName: string
  /** ID of the organization */
  orgId: string
  /** Name of the organization */
  orgName: string
  /** Collect saturated metrics */
  collectSaturatedMetrics?: boolean
  /** Is the instance managed by Ynput Cloud? */
  managed?: boolean
  /** List of subscriptions */
  subscriptions?: YnputConnectSubscriptionModel[]
}
export type YnputConnectRequestModel = {
  /** Ynput cloud key */
  key: string
}
export type SourceModel = {
  /** If set to server, the file is stored on the server. If set to http, the file is downloaded from the specified URL. */
  type: 'server' | 'http'
  /** URL to download the file from. Only used if type is url */
  url?: string
}
export type DependencyPackage = {
  filename: string
  platform: 'windows' | 'linux' | 'darwin'
  size?: number
  checksum?: string
  checksumAlgorithm?: 'md5' | 'sha1' | 'sha256'
  /** List of sources to download the file from. Server source is added automatically by the server if the file is uploaded. */
  sources?: SourceModel[]
  /** Version of the Ayon installer this package is created with */
  installerVersion: string
  /** mapping of addon_name:addon_version used to create the package */
  sourceAddons?: {
    [key: string]: string
  }
  /** mapping of module_name:module_version used to create the package */
  pythonModules?: {
    [key: string]:
      | string
      | {
          [key: string]: string
        }
  }
}
export type DependencyPackageList = {
  packages?: DependencyPackage[]
}
export type InstallResponseModel = {
  eventId?: string
}
export type SourcesPatchModel = {
  /** List of sources to download the file from. Server source is added automatically by the server if the file is uploaded. */
  sources?: SourceModel[]
}
export type Installer = {
  filename: string
  platform: 'windows' | 'linux' | 'darwin'
  size?: number
  checksum?: string
  checksumAlgorithm?: 'md5' | 'sha1' | 'sha256'
  /** List of sources to download the file from. Server source is added automatically by the server if the file is uploaded. */
  sources?: SourceModel[]
  /** Version of the installer */
  version: string
  /** Version of Python that the installer is created with */
  pythonVersion: string
  /** mapping of module name:version used to create the installer */
  pythonModules?: {
    [key: string]:
      | string
      | {
          [key: string]: string
        }
  }
  /** mapping of module_name:module_version used to run the installer */
  runtimePythonModules?: {
    [key: string]: string
  }
}
export type InstallerListModel = {
  installers?: Installer[]
}
export type EnrollResponseModel = {
  id: string
  dependsOn: string
  hash: string
  status?: string
}
export type Condition = {
  /** Path to the key separated by slashes */
  key: string
  /** Value to compare against */
  value?: string | number | number | string[] | number[] | number[]
  operator?:
    | 'eq'
    | 'lt'
    | 'gt'
    | 'lte'
    | 'gte'
    | 'ne'
    | 'isnull'
    | 'notnull'
    | 'in'
    | 'notin'
    | 'contains'
    | 'excludes'
}
export type Filter = {
  /** List of conditions to be evaluated */
  conditions?: (Condition | Filter)[]
  /** Operator to use when joining conditions */
  operator?: 'and' | 'or'
}
export type EnrollRequestModel = {
  sourceTopic: string
  targetTopic: string
  sender: string
  /** Short, human readable description of the target event */
  description?: string
  /** Ensure events are processed in sequential order */
  sequential?: boolean
  /** Filter source events */
  filter?: Filter
  maxRetries?: number
  debug?: boolean
}
export type DispatchEventResponseModel = {
  /** ID of the created event. */
  id: string
}
export type DispatchEventRequestModel = {
  /** Topic of the event */
  topic: string
  /** Identifier of the process that sent the event. */
  sender?: string
  /** Deterministic hash of the event topic and summary/payload */
  hash?: string
  /** Name of the project if the event belong to one. */
  project?: string
  /** ID of the event this event depends on. */
  dependsOn?: string
  /** Short, human-readable description of the event and its state */
  description?: string
  /** Arbitrary topic-specific data sent to clients in real time */
  summary?: object
  /** Full event payload. Only avaiable in REST endpoint. */
  payload?: object
  /** Is event finished (one shot event) */
  finished?: boolean
  /** Set to False for fire-and-forget events */
  store?: boolean
}
export type EventModel = {
  id?: string
  hash: string
  topic: string
  /** Identifier of the process that sent the event. */
  sender?: string
  /** Name of the project if the event belong to one. */
  project?: string
  user?: string
  /** ID of the event this event depends on. */
  dependsOn?: string
  status?: 'pending' | 'in_progress' | 'finished' | 'failed' | 'aborted' | 'restarted'
  retries?: number
  /** Short, human-readable description of the event and its state */
  description?: string
  /** Arbitrary topic-specific data sent to clients in real time */
  summary?: object
  /** Full event payload. Only avaiable in REST endpoint. */
  payload?: object
  createdAt?: string
  updatedAt?: string
}
export type UpdateEventRequestModel = {
  /** Identifier of the process that sent the event. */
  sender?: string
  /** Deprecated use 'project' instead */
  projectName?: string
  /** Name of the project if the event belong to one. */
  project?: string
  user?: string
  status?: 'pending' | 'in_progress' | 'finished' | 'failed' | 'aborted' | 'restarted'
  /** Short, human-readable description of the event and its state */
  description?: string
  summary?: object
  payload?: object
  /** Percentage of progress. Transmitted to clients in real time. */
  progress?: number
  /** Force number of attempted retries */
  retries?: number
}
export type CreateFileResponseModel = {
  id: string
}
export type FolderAttribModel = {
  /** Frame rate */
  fps?: number
  /** Horizontal resolution */
  resolutionWidth?: number
  /** Vertical resolution */
  resolutionHeight?: number
  pixelAspect?: number
  clipIn?: number
  clipOut?: number
  frameStart?: number
  frameEnd?: number
  handleStart?: number
  handleEnd?: number
  /** Date and time when the project or task or asset was started */
  startDate?: string
  /** Deadline date and time */
  endDate?: string
  /** Textual description of the entity */
  description?: string
  tools?: string[]
  ftrackId?: string
  ftrackPath?: string
  /** The Shotgrid ID of this entity. */
  shotgridId?: string
  /** The Shotgrid Type of this entity. */
  shotgridType?: string
  hairColor?: string
  sokoId?: string
  sokoPath?: string
  goldCoins?: number
  /** How much of the pizza do I get to have? */
  pizzaShare?: number
  testy?: string
}
export type FolderModel = {
  /** Unique identifier of the {entity_name} */
  id?: string
  name: string
  label?: string
  folderType?: string
  /** Parent folder ID in the hierarchy */
  parentId?: string
  thumbnailId?: string
  path?: string
  attrib?: FolderAttribModel
  data?: object
  /** Whether the folder is active */
  active?: boolean
  ownAttrib?: string[]
  /** Status of the folder */
  status?: string
  /** Tags assigned to the the folder */
  tags?: string[]
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type FolderPatchModel = {
  name?: string
  label?: string
  folderType?: string
  /** Parent folder ID in the hierarchy */
  parentId?: string
  thumbnailId?: string
  /** Status of the folder */
  status?: string
  /** Tags assigned to the the folder */
  tags?: string[]
  attrib?: FolderAttribModel
  data?: object
  /** Whether the folder is active */
  active?: boolean
}
export type FolderListItem = {
  id: string
  path: string
  parentId?: string
  parents: string[]
  name: string
  label?: string
  folderType: string
  hasTasks?: boolean
  hasChildren?: boolean
  taskNames?: string[]
  status: string
  attrib?: object
  ownAttrib?: string[]
  updatedAt: string
}
export type FolderListModel = {
  detail: string
  folders: FolderListItem[]
}
export type EntityIdResponse = {
  /** Entity ID */
  id: string
}
export type FolderPostModel = {
  /** Explicitly set the ID of the entity */
  id?: string
  name: string
  label?: string
  folderType?: string
  /** Parent folder ID in the hierarchy */
  parentId?: string
  thumbnailId?: string
  /** Status of the folder */
  status?: string
  /** Tags assigned to the the folder */
  tags?: string[]
  attrib?: FolderAttribModel
  data?: object
  /** Whether the folder is active */
  active?: boolean
}
export type HierarchyFolderModel = {
  /** Folder ID */
  id: string
  name: string
  label: string
  status: string
  folderType?: string
  hasTasks: boolean
  taskNames: string[]
  parents: string[]
  parentId?: string
  children?: HierarchyFolderModel[]
}
export type HierarchyResponseModel = {
  detail: string
  projectName: string
  hierarchy: HierarchyFolderModel[]
}
export type ManageInboxItemRequest = {
  projectName: string
  /** List of reference_ids of items to be managed */
  ids?: string[]
  /** Status to set for the items */
  status: 'unread' | 'read' | 'inactive'
}
export type LinkTypeModel = {
  /** Name of the link type */
  name: string
  /** Type of the link */
  linkType: string
  /** Input entity type */
  inputType: string
  /** Output entity type */
  outputType: string
  /** Additional link type data */
  data?: object
}
export type LinkTypeListResponse = {
  /** List of link types */
  types: LinkTypeModel[]
}
export type CreateLinkTypeRequestModel = {
  /** Link data */
  data?: object
}
export type CreateLinkRequestModel = {
  /** The ID of the input entity. */
  input: string
  /** The ID of the output entity. */
  output: string
  /** The name of the link. */
  name?: string
  /** Link type to create. This is deprecated. Use linkType instead. */
  link?: string
  /** Link type to create. */
  linkType?: string
  /** Link data */
  data?: object
}
export type InitializeRequestModel = {
  /** Username */
  adminName: string
  /** Password */
  adminPassword: string
  /** Full name */
  adminFullName?: string
  adminEmail?: string
}
export type ReleaseListItemModel = {
  name: string
  label: string
  bio?: string
  icon?: string
  createdAt: string
  isLatest: boolean
  addons: string[]
  mandatoryAddons?: string[]
}
export type ReleaseListModel = {
  releases: ReleaseListItemModel[]
}
export type ReleaseAddon = {
  name: string
  title?: string
  description?: string
  icon?: string
  preview?: string
  features?: string[]
  families?: string[]
  tags?: string[]
  docs?: {
    [key: string]: string
  }
  github?: string
  discussion?: string
  isFree?: boolean
  version?: string
  url?: string
  /** Checksum of the zip file */
  checksum?: string
  mandatory?: boolean
}
export type InstallerManifest = {
  filename: string
  platform: 'windows' | 'linux' | 'darwin'
  size?: number
  checksum?: string
  checksumAlgorithm?: 'md5' | 'sha1' | 'sha256'
  /** List of sources to download the file from. Server source is added automatically by the server if the file is uploaded. */
  sources?: SourceModel[]
  /** Version of the installer */
  version: string
  /** Version of Python that the installer is created with */
  pythonVersion: string
  /** mapping of module name:version used to create the installer */
  pythonModules?: {
    [key: string]:
      | string
      | {
          [key: string]: string
        }
  }
  /** mapping of module_name:module_version used to run the installer */
  runtimePythonModules?: {
    [key: string]: string
  }
}
export type DependencyPackageManifest = {
  filename: string
  platform: 'windows' | 'linux' | 'darwin'
  size?: number
  checksum?: string
  checksumAlgorithm?: 'md5' | 'sha1' | 'sha256'
  /** List of sources to download the file from. Server source is added automatically by the server if the file is uploaded. */
  sources?: SourceModel[]
  /** Version of the Ayon installer this package is created with */
  installerVersion: string
  /** mapping of addon_name:addon_version used to create the package */
  sourceAddons?: {
    [key: string]: string
  }
  /** mapping of module_name:module_version used to create the package */
  pythonModules?: {
    [key: string]:
      | string
      | {
          [key: string]: string
        }
  }
}
export type ReleaseInfoModel = {
  name: string
  label: string
  createdAt?: string
  addons?: ReleaseAddon[]
  installers?: InstallerManifest[]
  dependencyPackages?: DependencyPackageManifest[]
}
export type OperationResponseModel = {
  id: string
  type: 'create' | 'update' | 'delete'
  success: boolean
  status?: number
  detail?: string
  entityType: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  /** `None` if type is `create` and the operation fails. */
  entityId?: string
}
export type OperationsResponseModel = {
  operations?: OperationResponseModel[]
  success: boolean
}
export type OperationModel = {
  /** identifier manually or automatically assigned to each operation */
  id?: string
  type: 'create' | 'update' | 'delete'
  entityType: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  /** ID of the entity. None for create */
  entityId?: string
  /** Data to be used for create or update. Ignored for delete. */
  data?: object
  force?: boolean
}
export type OperationsRequestModel = {
  operations?: OperationModel[]
  canFail?: boolean
}
export type ProductAttribModel = {
  productGroup?: string
  /** Textual description of the entity */
  description?: string
}
export type ProductModel = {
  /** Unique identifier of the {entity_name} */
  id?: string
  /** Name of the product */
  name: string
  /** ID of the parent folder */
  folderId: string
  /** Product  */
  productType: string
  attrib?: ProductAttribModel
  data?: object
  /** Whether the product is active */
  active?: boolean
  ownAttrib?: string[]
  /** Status of the product */
  status?: string
  /** Tags assigned to the the product */
  tags?: string[]
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type ProductPatchModel = {
  /** Name of the product */
  name?: string
  /** ID of the parent folder */
  folderId?: string
  /** Product  */
  productType?: string
  /** Status of the product */
  status?: string
  /** Tags assigned to the the product */
  tags?: string[]
  attrib?: ProductAttribModel
  data?: object
  /** Whether the product is active */
  active?: boolean
}
export type ProductPostModel = {
  /** Explicitly set the ID of the entity */
  id?: string
  /** Name of the product */
  name: string
  /** ID of the parent folder */
  folderId: string
  /** Product  */
  productType: string
  /** Status of the product */
  status?: string
  /** Tags assigned to the the product */
  tags?: string[]
  attrib?: ProductAttribModel
  data?: object
  /** Whether the product is active */
  active?: boolean
}
export type EntityCounts = {
  /** Number of folders */
  folders: number
  /** Number of products */
  products: number
  /** Number of versions */
  versions: number
  /** Number of representations */
  representations: number
  /** Number of tasks */
  tasks: number
  /** Number of workfiles */
  workfiles: number
}
export type HealthCompletion = {
  /** Percentage of tasks completed */
  percentage: number
  /** Number of days tasks are not completed after due date */
  behind: number
  /** Number of days tasks are completed before due date */
  ahead: number
}
export type HealthStorageUsage = {
  /** Storage quota */
  quota: number
  /** Storage used */
  used: number
}
export type HealthTasks = {
  /** Total number of tasks */
  total: number
  /** Number of completed tasks */
  completed: number
  /** Number of overdue tasks */
  overdue: number
}
export type Health = {
  /** Task completion */
  completion: HealthCompletion
  /** Storage usage */
  storageUsage: HealthStorageUsage
  /** Task statistics */
  tasks: HealthTasks
  /** Task status statistics */
  statuses: {
    [key: string]: number
  }
}
export type ActivityResponseModel = {
  /** Activity per day normalized to 0-100 */
  activity: number[]
}
export type UsersResponseModel = {
  /** Number of active team members */
  teamSizeActive?: number
  /** Total number of team members */
  teamSizeTotal?: number
  /** Number of active users */
  usersWithAccessActive?: number
  /** Total number of users */
  usersWithAccessTotal?: number
  /** Number of users per role */
  roles: {
    [key: string]: number
  }
}
export type ListProjectsItemModel = {
  name: string
  code: string
  active: boolean
  createdAt: string
  updatedAt: string
}
export type ListProjectsResponseModel = {
  detail?: string
  /** Total count of projects (regardless the pagination) */
  count?: number
  /** List of projects */
  projects?: ListProjectsItemModel[]
}
export type DeployProjectRequestModel = {
  /** Project name */
  name: string
  /** Project code */
  code: string
  /** Project anatomy */
  anatomy: ProjectAnatomy
  /** Library project */
  library?: boolean
}
export type ProjectAttribModel2 = {
  /** Frame rate */
  fps?: number
  /** Horizontal resolution */
  resolutionWidth?: number
  /** Vertical resolution */
  resolutionHeight?: number
  pixelAspect?: number
  clipIn?: number
  clipOut?: number
  frameStart?: number
  frameEnd?: number
  handleStart?: number
  handleEnd?: number
  /** Date and time when the project or task or asset was started */
  startDate?: string
  /** Deadline date and time */
  endDate?: string
  /** Textual description of the entity */
  description?: string
  applications?: string[]
  tools?: string[]
  ftrackId?: string
  ftrackPath?: string
  /** The Shotgrid ID of this entity. */
  shotgridId?: string
  /** The Shotgrid Type of this entity. */
  shotgridType?: string
  /** Push changes done to this project to Shotgird. Requires the transmitter service. */
  shotgridPush?: boolean
  sokoId?: string
  sokoPath?: string
}
export type ProjectModel = {
  /** Name is an unique id of the {entity_name} */
  name: string
  code: string
  library?: boolean
  folderTypes?: any[]
  taskTypes?: any[]
  linkTypes?: LinkTypeModel[]
  statuses?: any[]
  /** List of tags available to set on entities. */
  tags?: any[]
  config?: object
  attrib?: ProjectAttribModel2
  data?: object
  /** Whether the project is active */
  active?: boolean
  ownAttrib?: string[]
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type ProjectPostModel = {
  code: string
  library?: boolean
  folderTypes?: any[]
  taskTypes?: any[]
  linkTypes?: LinkTypeModel[]
  statuses?: any[]
  /** List of tags available to set on entities. */
  tags?: any[]
  config?: object
  attrib?: ProjectAttribModel2
  data?: object
  /** Whether the project is active */
  active?: boolean
}
export type ProjectPatchModel = {
  code?: string
  library?: boolean
  folderTypes?: any[]
  taskTypes?: any[]
  linkTypes?: LinkTypeModel[]
  statuses?: any[]
  /** List of tags available to set on entities. */
  tags?: any[]
  config?: object
  attrib?: ProjectAttribModel2
  data?: object
  /** Whether the project is active */
  active?: boolean
}
export type QueryRequestModel = {
  entity:
    | 'event'
    | 'project'
    | 'user'
    | 'folder'
    | 'product'
    | 'task'
    | 'version'
    | 'representation'
    | 'workfile'
  /** Filter events */
  filter?: Filter
  /** Maximum number of events to return */
  limit?: number
  /** Offset of the first event to return */
  offset?: number
}
export type LookupResponseModel = {
  /** List of matching representation ids */
  ids?: string[]
}
export type ContextFilterModel = {
  key: string
  /** List of regular expressions which at least one must match */
  values: string[]
}
export type LookupRequestModel = {
  names?: string[]
  versionIds?: string[]
  context?: ContextFilterModel[]
}
export type RepresentationFileModel = {
  /** Unique (within the representation) ID of the file */
  id: string
  /** File name */
  name?: string
  /** Path to the file */
  path: string
  /** Size of the file in bytes */
  size?: number
  hash?: string
  hashType?: 'md5' | 'sha1' | 'sha256' | 'op3'
}
export type RepresentationAttribModel = {
  /** Frame rate */
  fps?: number
  /** Horizontal resolution */
  resolutionWidth?: number
  /** Vertical resolution */
  resolutionHeight?: number
  pixelAspect?: number
  clipIn?: number
  clipOut?: number
  frameStart?: number
  frameEnd?: number
  handleStart?: number
  handleEnd?: number
  path?: string
  template?: string
  extension?: string
  /** Textual description of the entity */
  description?: string
}
export type RepresentationModel = {
  /** Unique identifier of the {entity_name} */
  id?: string
  /** The name of the representation */
  name: string
  /** ID of the parent version */
  versionId: string
  /** List of files */
  files?: RepresentationFileModel[]
  attrib?: RepresentationAttribModel
  data?: object
  /** Whether the representation is active */
  active?: boolean
  ownAttrib?: string[]
  /** Status of the representation */
  status?: string
  /** Tags assigned to the the representation */
  tags?: string[]
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type RepresentationPatchModel = {
  /** The name of the representation */
  name?: string
  /** ID of the parent version */
  versionId?: string
  /** List of files */
  files?: RepresentationFileModel[]
  /** Status of the representation */
  status?: string
  /** Tags assigned to the the representation */
  tags?: string[]
  attrib?: RepresentationAttribModel
  data?: object
  /** Whether the representation is active */
  active?: boolean
}
export type RepresentationPostModel = {
  /** Explicitly set the ID of the entity */
  id?: string
  /** The name of the representation */
  name: string
  /** ID of the parent version */
  versionId: string
  /** List of files */
  files?: RepresentationFileModel[]
  /** Status of the representation */
  status?: string
  /** Tags assigned to the the representation */
  tags?: string[]
  attrib?: RepresentationAttribModel
  data?: object
  /** Whether the representation is active */
  active?: boolean
}
export type ResolvedEntityModel = {
  projectName?: string
  folderId?: string
  productId?: string
  taskId?: string
  versionId?: string
  representationId?: string
  workfileId?: string
  /** Path to the file if a representation is specified */
  filePath?: string
  /** The deepest entity type queried */
  target?: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
}
export type ResolvedUriModel = {
  uri: string
  entities: ResolvedEntityModel[]
}
export type ResolveRequestModel = {
  /** If x-ayon-site-id header is provided, resolve representation path roots */
  resolveRoots?: boolean
  /** List of uris to resolve */
  uris: string[]
}
export type ReviewableProcessingStatus = {
  eventId?: string
  status: string
  description: string
}
export type ReviewableAuthor = {
  name: string
  fullName?: string
}
export type ReviewableModel = {
  fileId: string
  activityId: string
  filename: string
  label?: string
  mimetype: string
  availability?: 'unknown' | 'conversionRequired' | 'conversionRecommended' | 'ready'
  mediaInfo?: object
  createdFrom?: string
  /** Information about the processing status */
  processing?: ReviewableProcessingStatus
  createdAt?: string
  updatedAt?: string
  author: ReviewableAuthor
}
export type VersionReviewablesModel = {
  id: string
  name: string
  version: string
  status: string
  productId: string
  productName: string
  productType: string
  /** List of available reviewables */
  reviewables?: ReviewableModel[]
}
export type SortReviewablesRequest = {
  /** List of reviewable (activity) ids in the order you want them to appear in the UI. */
  sort?: string[]
}
export type UpdateReviewablesRequest = {
  label?: string
}
export type ServiceDataModel = {
  volumes?: string[]
  ports?: string[]
  memLimit?: string
  user?: string
  env?: object
  storagePath?: string
  image?: string
}
export type ServiceModel = {
  name: string
  hostname: string
  addonName: string
  addonVersion: string
  service: string
  shouldRun: boolean
  isRunning: boolean
  lastSeen?: string
  lastSeenDelta?: number
  data?: ServiceDataModel
}
export type ServiceListModel = {
  services?: ServiceModel[]
}
export type ServiceConfigModel = {
  volumes?: string[]
  ports?: string[]
  memLimit?: string
  user?: string
  env?: object
  storagePath?: string
}
export type SpawnServiceRequestModel = {
  addonName: string
  addonVersion: string
  service: string
  hostname: string
  config?: ServiceConfigModel
}
export type PatchServiceRequestModel = {
  shouldRun?: boolean
  config?: ServiceConfigModel
}
export type HostHealthModel = {
  cpu?: number
  mem?: number
}
export type HostModel = {
  name: string
  lastSeen: string
  health?: HostHealthModel
}
export type HostListResponseModel = {
  /** List of registered hosts */
  hosts?: HostModel[]
}
export type HeartbeatResponseModel = {
  services?: ServiceModel[]
}
export type HeartbeatRequestModel = {
  hostname: string
  health: HostHealthModel
  services?: string[]
}
export type AddonSettingsResponse = {
  /** Addon settings for each active addon */
  settings: {
    [key: string]: object
  }
  /** Active versions of the addon for the given variant */
  versions: {
    [key: string]: string
  }
}
export type AddonSettingsItemModel = {
  name: string
  version: string
  title: string
  hasSettings?: boolean
  hasProjectSettings?: boolean
  hasProjectSiteSettings?: boolean
  hasSiteSettings?: boolean
  hasStudioOverrides?: boolean
  hasProjectOverrides?: boolean
  hasProjectSiteOverrides?: boolean
  settings?: object
  siteSettings?: object
  isBroken?: boolean
  reason?: {
    [key: string]: string
  }
}
export type AllSettingsResponseModel = {
  bundleName: string
  addons?: AddonSettingsItemModel[]
}
export type SiteInfo = {
  id: string
  platform: 'windows' | 'linux' | 'darwin'
  hostname: string
  version: string
  users: string[]
}
export type ReleaseInfo = {
  version: string
  buildDate: string
  buildTime: string
  frontendBranch: string
  backendBranch: string
  frontendCommit: string
  backendCommit: string
}
export type SsoOption = {
  name: string
  title?: string
  icon?: string
  color?: string
  textColor?: string
  redirectKey?: string
  url: string
  args?: {
    [key: string]: string
  }
  callback: string
}
export type InfoResponseModel = {
  /** Instance specific message to be displayed in the login page */
  motd?: string
  /** URL of the background image for the login page */
  loginPageBackground?: string
  /** URL of the brand logo for the login page */
  loginPageBrand?: string
  /** Information about the current release */
  releaseInfo?: ReleaseInfo
  /** Version of the Ayon API */
  version?: string
  /** Time (seconds) since the server was started */
  uptime?: number
  /** No admin user exists, display 'Create admin user' form */
  noAdminUser?: boolean
  onboarding?: boolean
  passwordRecoveryAvailable?: boolean
  user?: UserModel
  attributes?: AttributeModel[]
  sites?: SiteInfo[]
  ssoOptions?: SsoOption[]
}
export type SystemMetricsData = {
  cpuUsage?: number
  memoryUsage?: number
  swapUsage?: number
  uptimeSeconds?: number
  runtimeSeconds?: number
  dbSizeShared?: number
  dbSizeTotal?: number
  redisSizeTotal?: number
  storageUtilizationTotal?: number
}
export type UserCounts = {
  total?: number
  active?: number
  admins?: number
  managers?: number
}
export type ProjectCounts = {
  total?: number
  active?: number
}
export type ProjectMetrics = {
  nickname: string
  folderCount?: number
  productCount?: number
  versionCount?: number
  representationCount?: number
  taskCount?: number
  workfileCount?: number
  rootCount?: number
  teamCount?: number
  /** Duration in days */
  duration?: number
  dbSize?: number
  storageUtilization?: number
  /** List of folder types in the project. Collected only in the 'saturated' mode. */
  folderTypes?: string[]
  /** List of task types in the project. Collected only in the 'saturated' mode. */
  taskTypes?: string[]
  /** List of statuses in the project. Collected only in the 'saturated' mode. */
  statuses?: string[]
}
export type ProductionBundle = {
  addons?: {
    [key: string]: string
  }
  launcherVersion?: string
}
export type SettingsOverrides = {
  addonName?: string
  addonVersion?: string
  /** List of paths to settings, which have a studio override */
  paths?: string[][]
}
export type ServiceInfo = {
  addonName: string
  addonVersion: string
  serviceName: string
}
export type Metrics = {
  version?: string
  /** Information about the branch and commit of the current release */
  releaseInfo?: ReleaseInfo
  /** Time (seconds) since the server was (re)started */
  uptime?: number
  /** System metrics data
    Contains information about machine utilization,
    and database sizes.
     */
  system?: SystemMetricsData
  /** Number of total and active users, admins and managers */
  userCounts?: UserCounts
  /** Number of total and active projects */
  projectCounts?: ProjectCounts
  /** Project specific metrics
    
    Contain information about size and usage of each active project.
     */
  projects?: ProjectMetrics[]
  /** Average number of events per project
    
    This disregards projects with less than 300 events
    (such as testing projects).
     */
  averageProjectEventCount?: number
  /** Addons and their versions installed on the server
    
    We track what addons are installed on the server, and compare this to the
    addons which are actually used in the production bundle.
     */
  installedAddons?: any[][]
  /** Return the count of events per topic.
    
    This helps us with optimization of event clean-up,
    and other maintenance tasks.
     */
  eventTopics?: {
    [key: string]: number
  }
  /** Addons and their versions used in the production bundle
    
    We track what addons are used in the production bundle, as well as what
    launcher version is used. This is used to determine if the production
    bundle is up to date with the latest addons and launcher version,
    and if not, to notify the user that they should update in case of
    security issues or other important changes.
     */
  productionBundle?: ProductionBundle
  /** Studio settings overrides
    
    We track what settings are overridden in the studio settings.
    This helps us determine, which settins are used the most and which
    settings are not used at all. This is used to determine how we should
    organize the settings in the UI and how the settings could be improved.
     */
  studioSettingsOverrides?: SettingsOverrides[]
  /** List of active services */
  services?: ServiceInfo[]
}
export type Secret = {
  name?: string
  value?: string
}
export type RestartRequiredModel = {
  /** Whether the server requires a restart */
  required: boolean
  /** The reason for the restart */
  reason?: string
}
export type TaskAttribModel = {
  /** Frame rate */
  fps?: number
  /** Horizontal resolution */
  resolutionWidth?: number
  /** Vertical resolution */
  resolutionHeight?: number
  pixelAspect?: number
  clipIn?: number
  clipOut?: number
  frameStart?: number
  frameEnd?: number
  handleStart?: number
  handleEnd?: number
  /** Date and time when the project or task or asset was started */
  startDate?: string
  /** Deadline date and time */
  endDate?: string
  /** Textual description of the entity */
  description?: string
  tools?: string[]
  ftrackId?: string
  ftrackPath?: string
  /** The Shotgrid ID of this entity. */
  shotgridId?: string
  /** The Shotgrid Type of this entity. */
  shotgridType?: string
  hairColor?: string
  sokoId?: string
  sokoPath?: string
  goldCoins?: number
  /** How much of the pizza do I get to have? */
  pizzaShare?: number
  testy?: string
}
export type TaskModel = {
  /** Unique identifier of the {entity_name} */
  id?: string
  name: string
  label?: string
  taskType: string
  thumbnailId?: string
  /** List of users assigned to the task */
  assignees?: string[]
  /** Folder ID */
  folderId?: string
  attrib?: TaskAttribModel
  data?: object
  /** Whether the task is active */
  active?: boolean
  ownAttrib?: string[]
  /** Status of the task */
  status?: string
  /** Tags assigned to the the task */
  tags?: string[]
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type TaskPatchModel = {
  name?: string
  label?: string
  taskType?: string
  thumbnailId?: string
  /** List of users assigned to the task */
  assignees?: string[]
  /** Folder ID */
  folderId?: string
  /** Status of the task */
  status?: string
  /** Tags assigned to the the task */
  tags?: string[]
  attrib?: TaskAttribModel
  data?: object
  /** Whether the task is active */
  active?: boolean
}
export type TaskPostModel = {
  /** Explicitly set the ID of the entity */
  id?: string
  name: string
  label?: string
  taskType: string
  thumbnailId?: string
  /** List of users assigned to the task */
  assignees?: string[]
  /** Folder ID */
  folderId?: string
  /** Status of the task */
  status?: string
  /** Tags assigned to the the task */
  tags?: string[]
  attrib?: TaskAttribModel
  data?: object
  /** Whether the task is active */
  active?: boolean
}
export type AssignUsersRequestModel = {
  /** What to do with the list of users */
  mode: 'add' | 'remove' | 'set'
  /** List of user names */
  users: string[]
}
export type TeamMemberModel = {
  name: string
  leader?: boolean
  roles?: string[]
}
export type TeamListItemModel = {
  /** Team name */
  name: string
  /** Number of members in the team */
  memberCount: number
  /** Team members */
  members?: TeamMemberModel[]
  /** Team leaders */
  leaders?: TeamMemberModel[]
}
export type TeamModel = {
  /** Team name */
  name: string
  /** Team members */
  members?: TeamMemberModel[]
}
export type TeamPutModel = {
  members: TeamMemberModel[]
}
export type CreateThumbnailResponseModel = {
  id: string
}
export type UriResponseItem = {
  id: string
  uri: string
}
export type GetUrisResponse = {
  uris?: UriResponseItem[]
}
export type GetUrisRequest = {
  entityType: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  ids?: string[]
}
export type PasswordResetRequestModel = {
  email: string
  url: string
}
export type PasswordResetModel = {
  token: string
  password?: string
}
export type NewUserModel = {
  attrib?: UserAttribModel
  data?: object
  /** Whether the user is active */
  active?: boolean
  /** Password for the new user */
  password?: string
  /** API Key for the new service user */
  apiKey?: string
}
export type UserPatchModel = {
  attrib?: UserAttribModel
  data?: object
  /** Whether the user is active */
  active?: boolean
}
export type ChangePasswordRequestModel = {
  /** New password */
  password?: string
  /** API Key to set to a service user */
  apiKey?: string
}
export type CheckPasswordRequestModel = {
  password: string
}
export type ChangeUserNameRequestModel = {
  /** New user name */
  newName: string
}
export type UserSessionModel = {
  token: string
  isService: boolean
  lastUsed: number
  clientInfo?: ClientInfo
}
export type UserSessionsResponseModel = {
  sessions: UserSessionModel[]
}
export type AccessGroupsOnProject = {
  /** Project name */
  project: string
  /** List of access groups on the project */
  accessGroups: string[]
}
export type AssignAccessGroupsRequestModel = {
  /** List of access groups to assign */
  accessGroups?: AccessGroupsOnProject[]
}
export type VersionAttribModel = {
  /** Frame rate */
  fps?: number
  /** Horizontal resolution */
  resolutionWidth?: number
  /** Vertical resolution */
  resolutionHeight?: number
  pixelAspect?: number
  clipIn?: number
  clipOut?: number
  frameStart?: number
  frameEnd?: number
  handleStart?: number
  handleEnd?: number
  intent?: string
  machine?: string
  source?: string
  comment?: string
  site?: string
  families?: string[]
  colorSpace?: string
  /** Textual description of the entity */
  description?: string
  ftrackId?: string
  sokoId?: string
  /** The version that is currently the one to use. */
  blessed?: boolean
}
export type VersionModel = {
  /** Unique identifier of the {entity_name} */
  id?: string
  /** Version number */
  version: number
  /** ID of the parent product */
  productId: string
  taskId?: string
  thumbnailId?: string
  author?: string
  attrib?: VersionAttribModel
  data?: object
  /** Whether the version is active */
  active?: boolean
  ownAttrib?: string[]
  /** Status of the version */
  status?: string
  /** Tags assigned to the the version */
  tags?: string[]
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type VersionPatchModel = {
  /** Version number */
  version?: number
  /** ID of the parent product */
  productId?: string
  taskId?: string
  thumbnailId?: string
  author?: string
  /** Status of the version */
  status?: string
  /** Tags assigned to the the version */
  tags?: string[]
  attrib?: VersionAttribModel
  data?: object
  /** Whether the version is active */
  active?: boolean
}
export type VersionPostModel = {
  /** Explicitly set the ID of the entity */
  id?: string
  /** Version number */
  version: number
  /** ID of the parent product */
  productId: string
  taskId?: string
  thumbnailId?: string
  author?: string
  /** Status of the version */
  status?: string
  /** Tags assigned to the the version */
  tags?: string[]
  attrib?: VersionAttribModel
  data?: object
  /** Whether the version is active */
  active?: boolean
}
export type WorkfileAttribModel = {
  extension?: string
  /** Textual description of the entity */
  description?: string
}
export type WorkfileModel = {
  /** Unique identifier of the {entity_name} */
  id?: string
  /** Path to the workfile */
  path: string
  /** ID of the parent task */
  taskId: string
  thumbnailId?: string
  createdBy?: string
  updatedBy?: string
  attrib?: WorkfileAttribModel
  data?: object
  /** Whether the workfile is active */
  active?: boolean
  ownAttrib?: string[]
  /** Status of the workfile */
  status?: string
  /** Tags assigned to the the workfile */
  tags?: string[]
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type WorkfilePatchModel = {
  /** Path to the workfile */
  path?: string
  /** ID of the parent task */
  taskId?: string
  thumbnailId?: string
  createdBy?: string
  updatedBy?: string
  /** Status of the workfile */
  status?: string
  /** Tags assigned to the the workfile */
  tags?: string[]
  attrib?: WorkfileAttribModel
  data?: object
  /** Whether the workfile is active */
  active?: boolean
}
export type WorkfilePostModel = {
  /** Explicitly set the ID of the entity */
  id?: string
  /** Path to the workfile */
  path: string
  /** ID of the parent task */
  taskId: string
  thumbnailId?: string
  createdBy?: string
  updatedBy?: string
  /** Status of the workfile */
  status?: string
  /** Tags assigned to the the workfile */
  tags?: string[]
  attrib?: WorkfileAttribModel
  data?: object
  /** Whether the workfile is active */
  active?: boolean
}
