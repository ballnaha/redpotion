// Don't cache 404 pages
export const revalidate = 0;

export default function NotFound() {
  return (
    <div>
      <h2>ไม่พบหน้าที่ต้องการ</h2>
      <p>ขออภัย ไม่พบหน้าที่คุณต้องการ</p>
    </div>
  )
} 