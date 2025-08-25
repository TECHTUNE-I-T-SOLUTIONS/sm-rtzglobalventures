ALTER TABLE public.order_items
ADD COLUMN ebook_id UUID NULL;

ALTER TABLE public.order_items
ADD CONSTRAINT order_items_ebook_id_fkey
FOREIGN KEY (ebook_id) REFERENCES public.ebooks(id) ON DELETE CASCADE;

-- I Added a check constraint to ensure either product_id or ebook_id is present, but not both
ALTER TABLE public.order_items
ADD CONSTRAINT chk_product_or_ebook_id
CHECK (
    (product_id IS NOT NULL AND ebook_id IS NULL) OR
    (product_id IS NULL AND ebook_id IS NOT NULL)
);
