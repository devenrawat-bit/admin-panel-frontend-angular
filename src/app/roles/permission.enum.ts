// src/app/roles/permission.enum.ts

export enum PermissionEnum {
  None = 0,

  // User management
  ViewUser = 1,
  AddUser = 2,
  EditUser = 4,
  DeleteUser = 8,

  // Role management
  ViewRole = 16,
  AddRole = 32,
  EditRole = 64,
  DeleteRole = 128,

  // FAQ management
  ViewFaq = 256,
  AddFaq = 512,
  EditFaq = 1024,
  DeleteFaq = 2048,

  // CMS management
  ViewCms = 4096,
  AddCms = 8192,
  EditCms = 16384,
  DeleteCms = 32768,
}

// Pure bit values – yahin se hum decode/encode karenge
export const ALL_PERMISSION_VALUES: number[] = [
  PermissionEnum.ViewUser,
  PermissionEnum.AddUser,
  PermissionEnum.EditUser,
  PermissionEnum.DeleteUser,

  PermissionEnum.ViewRole,
  PermissionEnum.AddRole,
  PermissionEnum.EditRole,
  PermissionEnum.DeleteRole,

  PermissionEnum.ViewFaq,
  PermissionEnum.AddFaq,
  PermissionEnum.EditFaq,
  PermissionEnum.DeleteFaq,

  PermissionEnum.ViewCms,
  PermissionEnum.AddCms,
  PermissionEnum.EditCms,
  PermissionEnum.DeleteCms,
];

export interface PermissionOption {
  key: string;
  label: string;
  value: number;
}

export interface PermissionGroup {
  key: string;
  label: string;
  items: PermissionOption[];
}

// UI me group bana ke dikhane ke liye
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: 'user',
    label: 'User',
    items: [
      { key: 'ViewUser', label: 'List', value: PermissionEnum.ViewUser },
      { key: 'AddUser', label: 'Add', value: PermissionEnum.AddUser },
      { key: 'EditUser', label: 'Edit', value: PermissionEnum.EditUser },
      { key: 'DeleteUser', label: 'Delete', value: PermissionEnum.DeleteUser },
    ],
  },
  {
    key: 'role',
    label: 'Role',
    items: [
      { key: 'ViewRole', label: 'List', value: PermissionEnum.ViewRole },
      { key: 'AddRole', label: 'Add', value: PermissionEnum.AddRole },
      { key: 'EditRole', label: 'Edit', value: PermissionEnum.EditRole },
      { key: 'DeleteRole', label: 'Delete', value: PermissionEnum.DeleteRole },
    ],
  },
  {
    key: 'faq',
    label: 'FAQ',
    items: [
      { key: 'ViewFaq', label: 'List', value: PermissionEnum.ViewFaq },
      { key: 'AddFaq', label: 'Add', value: PermissionEnum.AddFaq },
      { key: 'EditFaq', label: 'Edit', value: PermissionEnum.EditFaq },
      { key: 'DeleteFaq', label: 'Delete', value: PermissionEnum.DeleteFaq },
    ],
  },
  {
    key: 'cms',
    label: 'CMS Management',
    items: [
      { key: 'ViewCms', label: 'List', value: PermissionEnum.ViewCms },
      { key: 'AddCms', label: 'Add', value: PermissionEnum.AddCms },
      { key: 'EditCms', label: 'Edit', value: PermissionEnum.EditCms },
      { key: 'DeleteCms', label: 'Delete', value: PermissionEnum.DeleteCms },
    ],
  },
];

// int → list of bit values
export function decodePermissionsToArray(value: number | null | undefined): number[] {
  const result: number[] = [];
  if (!value) return result;

  for (const v of ALL_PERMISSION_VALUES) {
    if ((value & v) === v) {
      result.push(v);
    }
  }
  return result;
}
