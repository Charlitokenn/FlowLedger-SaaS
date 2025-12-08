import React from 'react'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './ui/empty'

interface Props {
    media: React.ReactNode
    title?: string;
    description?: string;
    content?: React.ReactNode
}

const ReusableEmpty = ({ media, title, description, content}: Props) => (
    <Empty>
        <EmptyHeader>
            <EmptyMedia variant="icon">{media}</EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>{content}</EmptyContent>
    </Empty>
  )

export default ReusableEmpty