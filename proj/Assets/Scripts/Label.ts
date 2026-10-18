/** World-space text label. Light colors only: the display is additive. */
export function createLabel(parent: SceneObject, name: string, size: number, color: vec4): Text {
  const obj = global.scene.createSceneObject(name)
  obj.setParent(parent)
  const text = obj.createComponent("Component.Text") as Text
  text.size = size
  text.horizontalAlignment = HorizontalAlignment.Center
  text.verticalAlignment = VerticalAlignment.Center
  text.horizontalOverflow = HorizontalOverflow.Overflow
  text.verticalOverflow = VerticalOverflow.Overflow
  text.twoSided = true
  text.textFill.color = color
  text.outlineSettings.enabled = false
  return text
}
