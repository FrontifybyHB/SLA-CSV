import { memo } from 'react'
import type { IconType } from 'react-icons'
import {
  MdAlternateEmail,
  MdAnalytics,
  MdArrowBack,
  MdArrowForward,
  MdBolt,
  MdBugReport,
  MdCheckCircle,
  MdClose,
  MdCloudUpload,
  MdContentCopy,
  MdDataObject,
  MdDescription,
  MdDomain,
  MdDownload,
  MdEnhancedEncryption,
  MdError,
  MdFactCheck,
  MdFilterList,
  MdHelp,
  MdHowToReg,
  MdLock,
  MdMemory,
  MdMenu,
  MdMonitor,
  MdMoreVert,
  MdOpenInNew,
  MdQueryStats,
  MdRefresh,
  MdRocketLaunch,
  MdSchedule,
  MdSchema,
  MdScience,
  MdSearch,
  MdSettings,
  MdShield,
  MdSpeed,
  MdStackedLineChart,
  MdStorage,
  MdSwapHoriz,
  MdSync,
  MdTableRows,
  MdTerminal,
  MdTroubleshoot,
  MdTune,
  MdUpload,
  MdVerifiedUser,
  MdVisibility,
  MdVisibilityOff,
  MdWarning,
} from 'react-icons/md'

/**
 * Single icon entry-point for the whole app.
 *
 * All icons come from `react-icons` (inline SVG). Nothing here renders a
 * text glyph or an icon font, so there is no ligature flash where e.g. the
 * word "menu" appears briefly before the font loads — the SVG is in the DOM
 * on first paint.
 */
const ICONS = {
  alternate_email: MdAlternateEmail,
  analytics: MdAnalytics,
  arrow_back: MdArrowBack,
  arrow_forward: MdArrowForward,
  bolt: MdBolt,
  bug_report: MdBugReport,
  check_circle: MdCheckCircle,
  close: MdClose,
  cloud_upload: MdCloudUpload,
  content_copy: MdContentCopy,
  data_object: MdDataObject,
  database: MdStorage,
  description: MdDescription,
  domain: MdDomain,
  download: MdDownload,
  enhanced_encryption: MdEnhancedEncryption,
  error: MdError,
  fact_check: MdFactCheck,
  filter_list: MdFilterList,
  help: MdHelp,
  how_to_reg: MdHowToReg,
  lock: MdLock,
  memory: MdMemory,
  menu: MdMenu,
  monitoring: MdMonitor,
  more_vert: MdMoreVert,
  open_in_new: MdOpenInNew,
  query_stats: MdQueryStats,
  refresh: MdRefresh,
  rocket_launch: MdRocketLaunch,
  schedule: MdSchedule,
  schema: MdSchema,
  science: MdScience,
  search: MdSearch,
  settings: MdSettings,
  shield: MdShield,
  speed: MdSpeed,
  stacked_line_chart: MdStackedLineChart,
  swap_horiz: MdSwapHoriz,
  sync: MdSync,
  table_rows: MdTableRows,
  terminal: MdTerminal,
  troubleshoot: MdTroubleshoot,
  tune: MdTune,
  upload: MdUpload,
  verified_user: MdVerifiedUser,
  visibility: MdVisibility,
  visibility_off: MdVisibilityOff,
  warning: MdWarning,
} satisfies Record<string, IconType>

export type IconName = keyof typeof ICONS

interface IconProps {
  name: IconName | string
  size?: number
  className?: string
  /** Kept for compatibility; react-icons render filled glyphs by default. */
  filled?: boolean
}

export const Icon = memo(function Icon({ name, size = 18, className = '' }: IconProps) {
  const Component: IconType = (ICONS as Record<string, IconType>)[name] ?? MdFactCheck
  return (
    <Component
      aria-hidden="true"
      focusable="false"
      size={size}
      className={className ? `app-icon ${className}` : 'app-icon'}
    />
  )
})
