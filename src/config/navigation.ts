import {
	BookOpen,
	Coins,
	Gift,
	Skull,
	Swords,
	Waves,
	Zap,
	type LucideIcon,
} from 'lucide-react'

export interface NavigationItem {
	key: string // 用于翻译键，如 'codes' -> t('nav.codes')
	path: string // URL 路径，如 '/codes'
	icon: LucideIcon // Lucide 图标组件
	isContentType: boolean // 是否对应 content/ 目录
}

// 导航配置：Be The Final Boss 7 个内容分类（community 已删除）
// 顺序按 00基础信息.md 优先级：Codes > Beginner(guide) > Minions > Weapons > Skill Tree(skills) > Waves > Currencies
export const NAVIGATION_CONFIG: NavigationItem[] = [
	{ key: 'codes', path: '/codes', icon: Gift, isContentType: true },
	{ key: 'guide', path: '/guide', icon: BookOpen, isContentType: true },
	{ key: 'minions', path: '/minions', icon: Skull, isContentType: true },
	{ key: 'weapons', path: '/weapons', icon: Swords, isContentType: true },
	{ key: 'skills', path: '/skills', icon: Zap, isContentType: true },
	{ key: 'waves', path: '/waves', icon: Waves, isContentType: true },
	{ key: 'currencies', path: '/currencies', icon: Coins, isContentType: true },
]

// 从配置派生内容类型列表（用于路由和内容加载）
export const CONTENT_TYPES = NAVIGATION_CONFIG.filter((item) => item.isContentType).map(
	(item) => item.path.slice(1),
) // 移除开头的 '/' -> []

export type ContentType = (typeof CONTENT_TYPES)[number]

// 辅助函数：验证内容类型
export function isValidContentType(type: string): type is ContentType {
	return CONTENT_TYPES.includes(type as ContentType)
}
