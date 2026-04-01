-- Allow moderators to update their own attendance records
CREATE POLICY "Moderators update own attendance"
ON public.attendance_records
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'moderator'::app_role) 
  AND staff_id IN (SELECT id FROM staff_members WHERE user_id = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'moderator'::app_role)
  AND staff_id IN (SELECT id FROM staff_members WHERE user_id = auth.uid())
);