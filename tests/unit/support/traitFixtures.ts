// Generated from ayon-core trait classes (traits_as_dict) and the /api/traits response
// of core 1.10.1+dev. `legacyExr` is stored data of an older ayon-core version.
export const traitFixtures = {
  "definitions": [
    {
      "id": "ayon.2d.Image.v1",
      "versionlessId": "ayon.2d.Image",
      "version": 1,
      "name": "Image",
      "description": "Image Trait",
      "persistent": true,
      "deprecated": false,
      "introducedIn": "1.10.0+dev",
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "title": "Image",
        "description": "Image trait model.",
        "properties": {}
      },
      "ui": null,
      "hashes": {
        "schema": "sha256:98ca3298c218655ed4a808575e79fc6506d34bb234202ea091beb09d0c37c9f3",
        "behavior": "sha256:c4d592ec1a8adbc3aeb8d21cf5904f8ed3de91c63d3424231183486191f18cdb",
        "meta": "sha256:4a140418377ec3bf464292f31a864221d35ecc2a511addfbd3603b9b2a982198"
      },
      "addonName": "core",
      "addonVersions": [
        "1.10.1+dev"
      ],
      "conflict": false
    },
    {
      "id": "ayon.2d.PixelBased.v1",
      "versionlessId": "ayon.2d.PixelBased",
      "version": 1,
      "name": "PixelBased",
      "description": "PixelBased Trait Model",
      "persistent": true,
      "deprecated": false,
      "introducedIn": "1.10.0+dev",
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "title": "PixelBased",
        "description": "PixelBased trait model.",
        "properties": {
          "display_window_width": {
            "type": "integer",
            "description": "Width of the image display window."
          },
          "display_window_height": {
            "type": "integer",
            "description": "Height of the image display window."
          },
          "pixel_aspect_ratio": {
            "type": "number",
            "description": "Pixel aspect ratio."
          }
        },
        "required": [
          "display_window_width",
          "display_window_height",
          "pixel_aspect_ratio"
        ]
      },
      "ui": null,
      "hashes": {
        "schema": "sha256:3501e906a8d1e8628befd49cf12e5239fc53911a762972412197c57dbaf2988b",
        "behavior": "sha256:5eb92465f1c2a0d5119d7288b7c144bdb5af4d60faa2734ebac143546c2e606c",
        "meta": "sha256:ff38511e7eb353352aac5ab94f0d937b8403fded6f0d9f6b17787658b966abe2"
      },
      "addonName": "core",
      "addonVersions": [
        "1.10.1+dev"
      ],
      "conflict": false
    },
    {
      "id": "ayon.2d.UDIM.v1",
      "versionlessId": "ayon.2d.UDIM",
      "version": 1,
      "name": "UDIM",
      "description": "UDIM Trait",
      "persistent": true,
      "deprecated": false,
      "introducedIn": "1.10.0+dev",
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "title": "UDIM",
        "description": "UDIM trait model.",
        "properties": {
          "udim": {
            "type": "array",
            "items": {
              "type": "integer"
            },
            "description": "UDIM value."
          },
          "udim_regex": {
            "type": [
              "string",
              "null"
            ],
            "default": "(?:\\.|_)(?P<udim>\\d+)\\.\\D+\\d?$",
            "description": "UDIM regex."
          }
        },
        "required": [
          "udim"
        ]
      },
      "ui": null,
      "hashes": {
        "schema": "sha256:ed62ee5b3f4a0d4e2d1c1bc76dfa69b98caa095eacd766ca6add95fecef1ecaf",
        "behavior": "sha256:3e5a203d11fded550170c062e02ca54925259343c05da3e2d8207de0d699677c",
        "meta": "sha256:441d3ecf8e53e65e7c0d3ac1428545f1fca69e2589cd35fe442171227d1f09a8"
      },
      "addonName": "core",
      "addonVersions": [
        "1.10.1+dev"
      ],
      "conflict": false
    },
    {
      "id": "ayon.content.Bundle.v1",
      "versionlessId": "ayon.content.Bundle",
      "version": 1,
      "name": "Bundle",
      "description": "Bundle Trait",
      "persistent": true,
      "deprecated": false,
      "introducedIn": "1.10.0+dev",
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "title": "Bundle",
        "description": "Bundle trait model.",
        "properties": {
          "items": {
            "type": "array",
            "items": {
              "type": "object",
              "format": "ayon-traits",
              "additionalProperties": {
                "type": "object"
              }
            },
            "description": "List of representations."
          }
        },
        "required": [
          "items"
        ]
      },
      "ui": null,
      "hashes": {
        "schema": "sha256:fdeb8fa94effcbe0fc17bad81738909a048ed632cb869f54d5de3ae50b2fd350",
        "behavior": "sha256:dafcf7d161c8b4d52418b1e5b1411fe9eb6875ed3e3791184c808b354098992c",
        "meta": "sha256:2d1eb65d728385af223c4f33c4fc7d8543d4ab80aff38efb966ad404dbe5f0f7"
      },
      "addonName": "core",
      "addonVersions": [
        "1.10.1+dev"
      ],
      "conflict": false
    },
    {
      "id": "ayon.content.FileLocation.v2",
      "versionlessId": "ayon.content.FileLocation",
      "version": 2,
      "name": "FileLocation",
      "description": "FileLocation Trait Model",
      "persistent": true,
      "deprecated": false,
      "introducedIn": "1.10.0+dev",
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "title": "FileLocation",
        "description": "FileLocation trait model.",
        "properties": {
          "file_path": {
            "type": "string",
            "format": "path",
            "description": "File path."
          },
          "file_size": {
            "type": [
              "integer",
              "null"
            ],
            "default": null,
            "description": "File size in bytes."
          },
          "file_hash": {
            "type": [
              "string",
              "null"
            ],
            "default": null,
            "description": "File hash."
          },
          "file_hash_type": {
            "type": [
              "string",
              "null"
            ],
            "default": null,
            "description": "Algorithm used for `file_hash` (e.g. \"sha256\"), None if unknown."
          }
        },
        "required": [
          "file_path"
        ]
      },
      "ui": null,
      "hashes": {
        "schema": "sha256:ed192d6533ec00426e3c988a81a7ec32137decf206eba94906a451939f3bebce",
        "behavior": "sha256:e0b487d86e61df4c2ce7a9835cbb88edb844a1b985c6270de5bcff1fa0383f9e",
        "meta": "sha256:5ec0c23a08541154c12fec8454e77dd23461ac99a5a8da2a1a36abafc10473d9"
      },
      "addonName": "core",
      "addonVersions": [
        "1.10.1+dev"
      ],
      "conflict": false
    },
    {
      "id": "ayon.content.FileLocations.v2",
      "versionlessId": "ayon.content.FileLocations",
      "version": 2,
      "name": "FileLocations",
      "description": "FileLocations Trait Model",
      "persistent": true,
      "deprecated": false,
      "introducedIn": "1.10.0+dev",
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "title": "FileLocations",
        "description": "FileLocations trait model.",
        "properties": {
          "file_paths": {
            "type": "array",
            "items": {
              "$ref": "#/$defs/ayon.content.FileLocation.v2"
            },
            "description": "File locations."
          }
        },
        "required": [
          "file_paths"
        ],
        "$defs": {
          "ayon.content.FileLocation.v2": {
            "type": "object",
            "title": "FileLocation",
            "description": "FileLocation trait model.",
            "properties": {
              "file_path": {
                "type": "string",
                "format": "path",
                "description": "File path."
              },
              "file_size": {
                "type": [
                  "integer",
                  "null"
                ],
                "default": null,
                "description": "File size in bytes."
              },
              "file_hash": {
                "type": [
                  "string",
                  "null"
                ],
                "default": null,
                "description": "File hash."
              },
              "file_hash_type": {
                "type": [
                  "string",
                  "null"
                ],
                "default": null,
                "description": "Algorithm used for `file_hash` (e.g. \"sha256\"), None if unknown."
              }
            },
            "required": [
              "file_path"
            ]
          }
        }
      },
      "ui": null,
      "hashes": {
        "schema": "sha256:c6779bd7e2e9e50d525d82fe158ae82c0e90a3c90b547eb6e49f05b4f2de0e43",
        "behavior": "sha256:7e9e5870ceb5e342e5e8f5bf018661012e8caf31d62d2edfa03db0a59f2391bf",
        "meta": "sha256:2ed52edb45081fd0464c7c06b64e2263a6f19c5281fa43439b18189e9ed6ecba"
      },
      "addonName": "core",
      "addonVersions": [
        "1.10.1+dev"
      ],
      "conflict": false
    },
    {
      "id": "ayon.content.MimeType.v1",
      "versionlessId": "ayon.content.MimeType",
      "version": 1,
      "name": "MimeType",
      "description": "MimeType Trait Model",
      "persistent": true,
      "deprecated": false,
      "introducedIn": "1.10.0+dev",
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "title": "MimeType",
        "description": "MimeType trait model.",
        "properties": {
          "mime_type": {
            "type": "string",
            "description": "Mime type like image/jpeg."
          }
        },
        "required": [
          "mime_type"
        ]
      },
      "ui": null,
      "hashes": {
        "schema": "sha256:4fe66d677567b1da9e031b4b7fd3f8795b3caeda2f5a89242345c0c1e17187c5",
        "behavior": "sha256:0beb907a12cd8c53af14a761f89903e52d032ce8124efb4f5496f0c1169a5b02",
        "meta": "sha256:54d692552b465695c0f923cc2b146b3020304c17718e700ad409c4dc6ffdf2a6"
      },
      "addonName": "core",
      "addonVersions": [
        "1.10.1+dev"
      ],
      "conflict": false
    },
    {
      "id": "ayon.meta.Tagged.v1",
      "versionlessId": "ayon.meta.Tagged",
      "version": 1,
      "name": "Tagged",
      "description": "Tagged Trait Model",
      "persistent": true,
      "deprecated": false,
      "introducedIn": "1.10.0+dev",
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "title": "Tagged",
        "description": "Tagged trait model.",
        "properties": {
          "tags": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Tags."
          }
        },
        "required": [
          "tags"
        ]
      },
      "ui": null,
      "hashes": {
        "schema": "sha256:58667a679ebac85e62b3d8166717fb90fe9a422a2a506f82937ce2ab5b88938c",
        "behavior": "sha256:056448b0805c0225544655543e09b9bc9ec06f92b0be59e0627262efa5ea0714",
        "meta": "sha256:52eb2765e11ee9a90ffe389ba587eae64ebb93b9e2ce6692c1aaf52105873195"
      },
      "addonName": "core",
      "addonVersions": [
        "1.10.1+dev"
      ],
      "conflict": false
    },
    {
      "id": "ayon.time.FrameRanged.v2",
      "versionlessId": "ayon.time.FrameRanged",
      "version": 2,
      "name": "FrameRanged",
      "description": "Frame Ranged Trait",
      "persistent": true,
      "deprecated": false,
      "introducedIn": "1.10.0+dev",
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "title": "FrameRanged",
        "description": "Frame ranged trait model.",
        "properties": {
          "frame_start": {
            "type": "integer",
            "description": "Frame start."
          },
          "frame_end": {
            "type": "integer",
            "description": "Frame end."
          },
          "frame_in": {
            "type": [
              "integer",
              "null"
            ],
            "default": null,
            "description": "Frame in."
          },
          "frame_out": {
            "type": [
              "integer",
              "null"
            ],
            "default": null,
            "description": "Frame out."
          },
          "step": {
            "type": [
              "integer",
              "null"
            ],
            "default": null,
            "description": "Step."
          },
          "frame_rate_numerator": {
            "type": [
              "integer",
              "null"
            ],
            "default": null,
            "description": "Frame rate numerator."
          },
          "frame_rate_denominator": {
            "type": "integer",
            "default": 1,
            "description": "Frame rate denominator."
          }
        },
        "required": [
          "frame_start",
          "frame_end"
        ]
      },
      "ui": null,
      "hashes": {
        "schema": "sha256:8d52b239419fc68b5df757c7f2db0399ec9ad09bf791264f412c6b6c66d96eb4",
        "behavior": "sha256:c085665c31e72cdd2214647d87db3c5fd488c2fbc049a4f0d9ecfdc36cb0ae95",
        "meta": "sha256:1d919c67f6502afefcced896236d45c618311b03cce130694d11b62214bf7200"
      },
      "addonName": "core",
      "addonVersions": [
        "1.10.1+dev"
      ],
      "conflict": false
    },
    {
      "id": "ayon.time.Handles.v1",
      "versionlessId": "ayon.time.Handles",
      "version": 1,
      "name": "Handles",
      "description": "Handles Trait",
      "persistent": true,
      "deprecated": false,
      "introducedIn": "1.10.0+dev",
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "title": "Handles",
        "description": "Handles trait model.",
        "properties": {
          "inclusive": {
            "type": [
              "boolean",
              "null"
            ],
            "default": false,
            "description": "Handle frames are part of the files - they are included in the `FrameRanged` frame range."
          },
          "frame_start_handle": {
            "type": [
              "integer",
              "null"
            ],
            "default": null,
            "description": "Frame start handle."
          },
          "frame_end_handle": {
            "type": [
              "integer",
              "null"
            ],
            "default": null,
            "description": "Frame end handle."
          }
        }
      },
      "ui": null,
      "hashes": {
        "schema": "sha256:0b3f7dd2800c4820b59bd3d9fb16d14d8d4a9e896b53f035dac10191501875d6",
        "behavior": "sha256:6d3def357d7c5b6ccee78977ac8ec7ade957de99ec357a651b30973d12948643",
        "meta": "sha256:31180ee36af9d93ebb425310a5b872098dd48ad7bbf6750d364e3427d61a9dd9"
      },
      "addonName": "core",
      "addonVersions": [
        "1.10.1+dev"
      ],
      "conflict": false
    },
    {
      "id": "ayon.time.Sequence.v1",
      "versionlessId": "ayon.time.Sequence",
      "version": 1,
      "name": "Sequence",
      "description": "Sequence Trait Model",
      "persistent": true,
      "deprecated": false,
      "introducedIn": "1.10.0+dev",
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "title": "Sequence",
        "description": "Sequence trait model.",
        "properties": {
          "frame_padding": {
            "type": "integer",
            "description": "Frame padding."
          },
          "gaps_policy": {
            "type": [
              "string",
              "null"
            ],
            "enum": [
              "forbidden",
              "missing",
              "hold",
              "black",
              null
            ],
            "default": "forbidden",
            "description": "Gaps policy - how to handle gaps in sequence."
          },
          "frame_regex": {
            "type": [
              "string",
              "null"
            ],
            "format": "regex",
            "default": null,
            "description": "Frame regex - regular expression to match frame numbers. Must include 'index' named group and 'padding' named group."
          },
          "frame_spec": {
            "type": [
              "string",
              "null"
            ],
            "default": null,
            "description": "Frame list specification of frames. This takes string like \"1-10,20-30,40-50\" etc."
          }
        },
        "required": [
          "frame_padding"
        ]
      },
      "ui": null,
      "hashes": {
        "schema": "sha256:8038517fb649a5d23a0abd028675cf7abe70b67380c0a86a37513b9842d265f2",
        "behavior": "sha256:3a1d3ff1c5c1eba56a61d26e4a382efcc7fe79613fa4ea79e883036c5f591da8",
        "meta": "sha256:942e752c3fb3df2e865126195bca35c02a2f4f5ebe3c402db7992898b26ed8e4"
      },
      "addonName": "core",
      "addonVersions": [
        "1.10.1+dev"
      ],
      "conflict": false
    }
  ],
  "traits": {
    "exr": {
      "ayon.content.FileLocations.v2": {
        "file_paths": [
          {
            "file_path": "/proj/sh010/render.1001.exr",
            "file_size": 1048576,
            "file_hash": null,
            "file_hash_type": null
          },
          {
            "file_path": "/proj/sh010/render.1002.exr",
            "file_size": 1048576,
            "file_hash": null,
            "file_hash_type": null
          }
        ]
      },
      "ayon.time.FrameRanged.v2": {
        "frame_start": 1001,
        "frame_end": 1002,
        "frame_in": null,
        "frame_out": null,
        "step": null,
        "frame_rate_numerator": 25,
        "frame_rate_denominator": 1
      },
      "ayon.time.Handles.v1": {
        "inclusive": false,
        "frame_start_handle": 0,
        "frame_end_handle": 0
      },
      "ayon.time.Sequence.v1": {
        "frame_padding": 4,
        "gaps_policy": "forbidden",
        "frame_regex": "render\\.(?P<index>(?P<padding>0*)\\d+)\\.exr$",
        "frame_spec": null
      },
      "ayon.2d.Image.v1": {},
      "ayon.2d.PixelBased.v1": {
        "display_window_width": 1920,
        "display_window_height": 1080,
        "pixel_aspect_ratio": 1.0
      },
      "ayon.meta.Tagged.v1": {
        "tags": [
          "review",
          "burnin"
        ]
      }
    },
    "mp4": {
      "ayon.content.FileLocation.v2": {
        "file_path": "/proj/sh010/review.mp4",
        "file_size": 2048,
        "file_hash": null,
        "file_hash_type": null
      },
      "ayon.content.MimeType.v1": {
        "mime_type": "video/mp4"
      },
      "ayon.time.FrameRanged.v2": {
        "frame_start": 1001,
        "frame_end": 1025,
        "frame_in": null,
        "frame_out": null,
        "step": null,
        "frame_rate_numerator": 25,
        "frame_rate_denominator": 1
      }
    },
    "udim": {
      "ayon.content.FileLocations.v2": {
        "file_paths": [
          {
            "file_path": "/proj/tex.1001.png",
            "file_size": null,
            "file_hash": null,
            "file_hash_type": null
          },
          {
            "file_path": "/proj/tex.1002.png",
            "file_size": null,
            "file_hash": null,
            "file_hash_type": null
          }
        ]
      },
      "ayon.2d.UDIM.v1": {
        "udim": [
          1001,
          1002
        ],
        "udim_regex": "(?:\\.|_)(?P<udim>\\d+)\\.\\D+\\d?$"
      }
    },
    "bundle": {
      "ayon.content.Bundle.v1": {
        "items": [
          {
            "ayon.content.FileLocation.v2": {
              "file_path": "/proj/diffuse.png",
              "file_size": null,
              "file_hash": null,
              "file_hash_type": null
            },
            "ayon.content.MimeType.v1": {
              "mime_type": "image/png"
            }
          },
          {
            "ayon.content.Bundle.v1": {
              "items": [
                {
                  "ayon.content.FileLocation.v2": {
                    "file_path": "/proj/bump.exr",
                    "file_size": null,
                    "file_hash": null,
                    "file_hash_type": null
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "addon": {
      "shotgrid.moviepath.v1": {
        "path": "/proj/review.mov"
      }
    },
    "legacyExr": {
      "ayon.time.Sequence.v1": {
        "gaps_policy": "GapPolicy.forbidden",
        "frame_padding": 4
      },
      "ayon.time.FrameRanged.v1": {
        "frame_end": 1025,
        "frame_start": 1001,
        "frames_per_second": "25.0"
      },
      "ayon.content.FileLocations.v1": {
        "file_paths": "[{'file_path': WindowsPath('C:/proj/render.1001.exr'), 'file_size': None, 'file_hash': None}]"
      }
    }
  }
}
