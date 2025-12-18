-- Create default plots when a project is inserted

CREATE OR REPLACE FUNCTION public.create_plots_for_project()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create plots if number_of_plots is > 0
    IF NEW.number_of_plots > 0 THEN
        -- Use a set-based insert for performance and simplicity
        -- Rely on table defaults for id/availability/is_deleted/timestamps
        INSERT INTO public.plots (
            plot_number,
            -- surveyed_plot_number,
            unsurveyed_size,
            project_id
        )
        SELECT
            gs::numeric,
            -- (NEW.id::text || '-' || gs::text),
            0::numeric,
            NEW.id
        FROM generate_series(1, NEW.number_of_plots) AS gs;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

DROP TRIGGER IF EXISTS trg_create_plots_after_project_insert ON public.projects;
--> statement-breakpoint

CREATE TRIGGER trg_create_plots_after_project_insert
AFTER INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.create_plots_for_project();