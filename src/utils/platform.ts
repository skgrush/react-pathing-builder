interface Navigatorish {
  platform: string
  userAgent?: string
}

export type Platform = 'mac' | 'win' | 'mobile-ios' | 'mobile-android' | ''

export function getPlatform(N: Navigatorish = window.navigator): Platform {
  if (N.platform.startsWith('iP')) return 'mobile-ios'
  if (N.platform.includes('Android')) return 'mobile-android'
  if (N.platform.startsWith('Mac')) return 'mac'
  if (N.platform.startsWith('Win')) return 'win'
  if (N.userAgent && N.userAgent.includes('Android')) return 'mobile-android'

  return ''
}

const SUPPORTS_COLOR_PICKER = (function() {
  const inp = document.createElement('input')
  inp.type = 'color'
  return inp.type === 'color'
})()
export {SUPPORTS_COLOR_PICKER}

const nativePlatform = getPlatform()
export {nativePlatform}
