import React from 'react'
import { Row, Col } from 'antd'

interface FormRowProps {
  children: React.ReactNode
  gutter?: number
}

/** 将子 Form.Item 并排为一行两列（每个占 span=12）。整行字段请勿用此组件包裹。 */
const FormRow: React.FC<FormRowProps> = ({ children, gutter = 16 }) => {
  const items = React.Children.toArray(children)
  return (
    <Row gutter={gutter}>
      {items.map((child, i) => (
        <Col span={12} key={i}>{child}</Col>
      ))}
    </Row>
  )
}

export default FormRow
