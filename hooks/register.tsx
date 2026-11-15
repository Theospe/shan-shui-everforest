import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { SCENE } from './scene.js'

// Everforest palette: parchment paper by day, forest night by dark.
const { theme, problems } = makeColors({
  label: 'Shan Shui Everforest',
  roles: { accent: '#3f7f68', danger: '#bb4339', success: '#6b8a2a', warning: '#b07d12', pro: '#8a5f86' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#ece5cd',
        'surface-1': '#f3ecd6',
        'surface-2': '#f8f2df',
        'text-primary': '#34413a',
        'text-secondary': '#46534b',
        'text-muted': '#55625a',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#272e33',
        'surface-1': '#293136',
        'surface-2': '#2b3338',
        'surface-3': '#2b3338',
        'text-primary': '#ece3ca',
        'text-secondary': '#b5ae96',
        'text-muted': '#9da9a0',
      },
    },
  },
})

const LOOK: ThemeSetArgs = { colors: theme, backdrop: { scene: 'shan-shui', glass: { blur: 2, opacity: 0.72 } } }

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))

    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }
    const set = await $.theme.set(LOOK)

    if (!set.isDrawn) {
      $.ui.status(set.reason)
    }

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)

    return <Svg source={SCENE} alt="Misty ink-wash mountains" isInteractive />
  })
}
