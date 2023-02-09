export class UIController<T = any> {
  elementId;

  element;

  constructor(elementId: string) {
    this.elementId = elementId;

    if (!this.elementId) {
      throw new Error('StateController: elementId is required.')
    }

    const element = document.getElementById(this.elementId);

    if (!element) {
      throw new Error('StateController: Element not found in DOM.')
    }

    this.element = element
  }

  renderList(value: Record<string, T>, cb: (data: T) => HTMLElement) {
    if (!value) return;

    this.element.innerHTML = '';

    Object.values(value).forEach(item => {
      const elementToAppend = cb(item);

      this.element.appendChild(elementToAppend);
    });
  }
}