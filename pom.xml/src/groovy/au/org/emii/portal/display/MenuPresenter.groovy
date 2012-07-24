package au.org.emii.portal.display

class MenuPresenter {
	
	def id
	def title
	def menuItems

	MenuPresenter(domainMenu) {
		if (domainMenu) {
			id = domainMenu.id
			title = domainMenu.title
			_initItems(domainMenu.menuItems)
		}
	}
	
	def _initItems(domainMenuItems) {
		menuItems = []
		domainMenuItems.each { domainMenuItem ->
			menuItems << new MenuItemPresenter(domainMenuItem)
		}
	}
}
