export default [
    {
        "key": "item_type",
        "label": "Item Type",
        "required": true,
        "valueType": "string",
        "defaultValue": "task",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort"
        ]
    },
    {
        "key": "id",
        "label": "Folder ID",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "name",
        "label": "Folder name",
        "required": true,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort"
        ]
    },
    {
        "key": "label",
        "label": "Folder label",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "folder_type",
        "label": "Folder type",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "parent_id",
        "label": "Parent ID",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "thumbnail_id",
        "label": "Thumbnail ID",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "active",
        "label": "Folder active",
        "required": false,
        "valueType": "boolean",
        "defaultValue": "True",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "status",
        "label": "Folder status",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": [
          {
              "value": "Not ready",
              "label": "Not ready",
              "icon": "fiber_new",
              "color": "#3d444f"
          },
          {
              "value": "Ready to start",
              "label": "Ready to start",
              "icon": "timer",
              "color": "#bababa"
          },
          {
              "value": "In progress",
              "label": "In progress",
              "icon": "play_arrow",
              "color": "#5bb8f5"
          },
          {
              "value": "Pending review",
              "label": "Pending review",
              "icon": "visibility",
              "color": "#ffcd19"
          },
          {
              "value": "Reviewed",
              "label": "Reviewes",
              "icon": "do_not_disturb_on",
              "color": "#756db0"
          },
          {
              "value": "Approved",
              "label": "Approved",
              "icon": "task_alt",
              "color": "#08f094"
          },
          {
              "value": "On hold",
              "label": "On hold",
              "icon": "back_hand",
              "color": "#fa6e47"
          },
          {
              "value": "Omitted",
              "label": "Omitted",
              "icon": "block",
              "color": "#cb1a1a"
          },
          {
              "value": "data",
              "label": "data",
              "icon": "hard_drive",
              "color": "#cacac a"
          }
        ],
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "tags",
        "label": "Folder tags",
        "required": false,
        "valueType": "list_of_string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "created_by",
        "label": "Created by",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "updated_by",
        "label": "Updated by",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "created_at",
        "label": "Created at",
        "required": false,
        "valueType": "datetime",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "updated_at",
        "label": "Updated at",
        "required": false,
        "valueType": "datetime",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.priority",
        "label": "Priority",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.fps",
        "label": "FPS",
        "required": false,
        "valueType": "float",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.resolutionWidth",
        "label": "Width",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.resolutionHeight",
        "label": "Height",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.pixelAspect",
        "label": "Pixel aspect",
        "required": false,
        "valueType": "float",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.clipIn",
        "label": "Clip In",
        "required": false,
        "valueType": "integer",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.clipOut",
        "label": "Clip Out",
        "required": false,
        "valueType": "integer",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.frameStart",
        "label": "Start frame",
        "required": false,
        "valueType": "integer",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.frameEnd",
        "label": "End frame",
        "required": false,
        "valueType": "integer",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.handleStart",
        "label": "Handle start",
        "required": false,
        "valueType": "integer",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.handleEnd",
        "label": "Handle end",
        "required": false,
        "valueType": "integer",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.startDate",
        "label": "Start date",
        "required": false,
        "valueType": "datetime",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.endDate",
        "label": "End date",
        "required": false,
        "valueType": "datetime",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.description",
        "label": "Description",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.tools",
        "label": "Tools",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.ftrackId",
        "label": "Ftrack id",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.ftrackPath",
        "label": "Ftrack path",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.shotgridId",
        "label": "Shotgrid ID",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.shotgridType",
        "label": "Shotgrid Type",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.githubIssueLink",
        "label": "Github issue URL",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.customId",
        "label": "Custom Id",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.estimate",
        "label": "Estimate",
        "required": false,
        "valueType": "float",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.releaseVersion",
        "label": "Release Version",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.url",
        "label": "URL",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.clientPriority",
        "label": "Client Priority",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.clickupUrl",
        "label": "Clickup URL",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.repositories",
        "label": "Github Repositories",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "path",
        "label": "Path",
        "required": true,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "task_type",
        "label": "Task type",
        "required": true,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": [
          {
            "value": "Generic",
            "label": "Generic",
          },
          {
            "value": "Lookdev",
            "label": "Lookdev",
          },
          {
            "value": "Modeling",
            "label": "Modeling",
          },
          {
            "value": "Rigging",
            "label": "Rigging",
          },
          {
            "value": "Texture",
            "label": "Texture",
          },
          {
            "value": "FX",
            "label": "FX",
          },
          {
            "value": "Setdress",
            "label": "Setdress",
          },
          {
            "value": "Animation",
            "label": "Animation",
          },
          {
            "value": "Layout",
            "label": "Layout",
          },
          {
            "value": "Lighting",
            "label": "Lighting",
          }
        ],
        "errorHandlingModes": [
            "skip",
            "abort"
        ]
    },
    {
        "key": "assignees",
        "label": "Assignees",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "folder_id",
        "label": "Folder ID",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    },
    {
        "key": "attrib.jiraCurrentPhase",
        "label": "Jira Current Phase",
        "required": false,
        "valueType": "string",
        "defaultValue": "",
        "enumItems": null,
        "errorHandlingModes": [
            "skip",
            "abort",
            "default"
        ]
    }
]
